// #include "driver/i2s.h"
// #include "driver/i2s_std.h"
// #include "freertos/FreeRTOS.h"
// #include "freertos/task.h"

// #define I2S_NUM        I2S_NUM_0
// #define I2S_BCLK       26  // GPIO for Bit Clock
// #define I2S_LRCLK      25  // GPIO for Word Clock
// #define I2S_DIN        33  // GPIO for Data Input
// #define SAMPLE_RATE    48000  // Set sample rate

// void i2s_setup() {
//     i2s_config_t i2s_config = {
//         .mode = I2S_MODE_SLAVE | I2S_MODE_RX,
//         .sample_rate = SAMPLE_RATE,
//         .bits_per_sample = I2S_BITS_PER_SAMPLE_24BIT,
//         .channel_format = I2S_CHANNEL_FMT_RIGHT_LEFT,
//         .communication_format = I2S_COMM_FORMAT_I2S,
//         .dma_buf_count = 8,
//         .dma_buf_len = 1024,
//         .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1
//     };

//     i2s_pin_config_t pin_config = {
//         .bck_io_num = I2S_BCLK,
//         .ws_io_num = I2S_LRCLK,
//         .data_in_num = I2S_DIN,
//         .data_out_num = I2S_PIN_NO_CHANGE
//     };

//     i2s_driver_install(I2S_NUM, &i2s_config, 0, NULL);
//     i2s_set_pin(I2S_NUM, &pin_config);
// }

// void app_main() {
//     i2s_setup();
//     while (1) {
//         vTaskDelay(pdMS_TO_TICKS(1000)); // Keep the task alive
//     }
// }
#include <stdio.h>
#include <string.h>
#include "esp_timer.h"
#include "driver/spi_master.h"
#include "driver/gpio.h"
#include "esp_log.h"
#include "esp_err.h"
#include "esp_rom_sys.h"

// ADC Control Pins
#define SOC_PIN   16  // Start Conversion
#define EOC_PIN   5   // End of Conversion
#define CLK_PIN   17  // Clock Signal
#define ADDR_A    21  
#define ADDR_B    22  
#define ADDR_C    23  

// ADC Parallel Data Pins
#define ADC_D0   32  // LSB
#define ADC_D1   33
#define ADC_D2   34
#define ADC_D3    4
#define ADC_D4   36
#define ADC_D5   39
#define ADC_D6   25
#define ADC_D7   26  // MSB

// SPI Interface Pins (ESP32 <-> Raspberry Pi)
#define SPI_MOSI 18  // To Pi GP25
#define SPI_MISO 19  // To Pi GP16
#define SPI_SCLK 14  // To Pi GP24
#define SPI_CS   15  // To Pi GP17

#define SAMPLE_RATE 40000  // 40kHz sampling
#define SAMPLE_PERIOD (1000000 / SAMPLE_RATE) // Microseconds per sample

static const char *TAG = "ADC_SPI";
spi_device_handle_t spi;

// Function to configure a GPIO pin
void configure_gpio(int pin, gpio_mode_t mode, gpio_pull_mode_t pull_mode) {
    gpio_config_t io_conf = {
        .pin_bit_mask = (1ULL << pin),
        .mode = mode,
        .pull_up_en = (pull_mode == GPIO_PULLUP_ONLY) ? GPIO_PULLUP_ENABLE : GPIO_PULLUP_DISABLE,
        .pull_down_en = (pull_mode == GPIO_PULLDOWN_ONLY) ? GPIO_PULLDOWN_ENABLE : GPIO_PULLDOWN_DISABLE,
        .intr_type = GPIO_INTR_DISABLE
    };
    gpio_config(&io_conf);
}

// Initialize GPIO for ADC and SPI
void setup_gpio() {
    // Configure ADC Control Pins
    configure_gpio(SOC_PIN, GPIO_MODE_OUTPUT, GPIO_FLOATING);
    configure_gpio(EOC_PIN, GPIO_MODE_INPUT, GPIO_FLOATING);
    configure_gpio(CLK_PIN, GPIO_MODE_OUTPUT, GPIO_FLOATING);
    configure_gpio(ADDR_A, GPIO_MODE_OUTPUT, GPIO_FLOATING);
    configure_gpio(ADDR_B, GPIO_MODE_OUTPUT, GPIO_FLOATING);
    configure_gpio(ADDR_C, GPIO_MODE_OUTPUT, GPIO_FLOATING);

    // Set ADC Address to Read from IN0 (ADDR = 000)
    gpio_set_level(ADDR_A, 0);
    gpio_set_level(ADDR_B, 0);
    gpio_set_level(ADDR_C, 0);

    // Configure ADC Data Pins as INPUT
    configure_gpio(ADC_D0, GPIO_MODE_INPUT, GPIO_FLOATING);
    configure_gpio(ADC_D1, GPIO_MODE_INPUT, GPIO_FLOATING);
    configure_gpio(ADC_D2, GPIO_MODE_INPUT, GPIO_FLOATING);
    configure_gpio(ADC_D3, GPIO_MODE_INPUT, GPIO_FLOATING);
    configure_gpio(ADC_D4, GPIO_MODE_INPUT, GPIO_FLOATING);
    configure_gpio(ADC_D5, GPIO_MODE_INPUT, GPIO_FLOATING);
    configure_gpio(ADC_D6, GPIO_MODE_INPUT, GPIO_FLOATING);
    configure_gpio(ADC_D7, GPIO_MODE_INPUT, GPIO_FLOATING);
}

// Initialize SPI
void setup_spi() {
    spi_bus_config_t buscfg = {
        .miso_io_num = SPI_MISO,
        .mosi_io_num = SPI_MOSI,
        .sclk_io_num = SPI_SCLK,
        .quadwp_io_num = -1,
        .quadhd_io_num = -1,
    };

    spi_device_interface_config_t devcfg = {
        .clock_speed_hz = 1000000,  // 1 MHz SPI speed
        .mode = 0,                  // SPI mode 0
        .spics_io_num = SPI_CS,      // Chip Select
        .queue_size = 1,
    };

    esp_err_t ret;
    ret = spi_bus_initialize(SPI2_HOST, &buscfg, SPI_DMA_CH_AUTO);
    ESP_ERROR_CHECK(ret);
    ret = spi_bus_add_device(SPI2_HOST, &devcfg, &spi);
    ESP_ERROR_CHECK(ret);

    ESP_LOGI(TAG, "SPI Initialized.");
}

// Read ADC value
uint8_t read_adc() {
    // Start ADC Conversion
    gpio_set_level(SOC_PIN, 1);
    esp_rom_delay_us(5);
    gpio_set_level(SOC_PIN, 0);

    // Wait for EOC to go HIGH and then LOW (conversion complete)
    while (gpio_get_level(EOC_PIN) == 0);
    while (gpio_get_level(EOC_PIN) == 1);

    // Read 8-bit parallel data
    uint8_t value = (gpio_get_level(ADC_D7) << 7) |
                    (gpio_get_level(ADC_D6) << 6) |
                    (gpio_get_level(ADC_D5) << 5) |
                    (gpio_get_level(ADC_D4) << 4) |
                    (gpio_get_level(ADC_D3) << 3) |
                    (gpio_get_level(ADC_D2) << 2) |
                    (gpio_get_level(ADC_D1) << 1) |
                    (gpio_get_level(ADC_D0) << 0);

    return value;
}

// Send data over SPI
void send_spi(uint8_t data) {
    spi_transaction_t t;
    memset(&t, 0, sizeof(t));
    t.length = 8;        // 8-bit data
    t.tx_buffer = &data; // Pointer to data
    esp_err_t ret = spi_device_transmit(spi, &t);
    ESP_ERROR_CHECK(ret);
}

// Main loop function
void app_main() {
    setup_gpio();
    setup_spi();

    ESP_LOGI(TAG, "ADC and SPI Initialized.");

    while (1) {
        uint32_t start_time = esp_timer_get_time(); // Get current time in microseconds

        uint8_t adc_value = read_adc();  // Read ADC data
        send_spi(adc_value);             // Send to Raspberry Pi via SPI

        uint32_t elapsed_time = esp_timer_get_time() - start_time;
        if (elapsed_time < SAMPLE_PERIOD) {
            esp_rom_delay_us(SAMPLE_PERIOD - elapsed_time);
        }
    }
}

