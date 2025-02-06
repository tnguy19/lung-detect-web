#include "driver/i2s.h"
#include "driver/i2s_std.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

#define I2S_NUM        I2S_NUM_0
#define I2S_BCLK       26  // GPIO for Bit Clock
#define I2S_LRCLK      25  // GPIO for Word Clock
#define I2S_DIN        33  // GPIO for Data Input
#define SAMPLE_RATE    48000  // Set sample rate

void i2s_setup() {
    i2s_config_t i2s_config = {
        .mode = I2S_MODE_SLAVE | I2S_MODE_RX,
        .sample_rate = SAMPLE_RATE,
        .bits_per_sample = I2S_BITS_PER_SAMPLE_24BIT,
        .channel_format = I2S_CHANNEL_FMT_RIGHT_LEFT,
        .communication_format = I2S_COMM_FORMAT_I2S,
        .dma_buf_count = 8,
        .dma_buf_len = 1024,
        .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1
    };

    i2s_pin_config_t pin_config = {
        .bck_io_num = I2S_BCLK,
        .ws_io_num = I2S_LRCLK,
        .data_in_num = I2S_DIN,
        .data_out_num = I2S_PIN_NO_CHANGE
    };

    i2s_driver_install(I2S_NUM, &i2s_config, 0, NULL);
    i2s_set_pin(I2S_NUM, &pin_config);
}

void app_main() {
    i2s_setup();
    while (1) {
        vTaskDelay(pdMS_TO_TICKS(1000)); // Keep the task alive
    }
}
