#include "pico/stdlib.h"
#include "hardware/adc.h"
#include "hardware/dma.h"
#include "hardware/timer.h"
#include "pico/stdio_usb.h"   // For USB CDC
#include <stdio.h>
#include <string.h>

// -------------------- Configuration --------------------
#define SAMPLE_RATE      40000         // 40 kHz sample rate (25µs per sample)
#define NUM_CHANNELS     1             // Number of ADC channels to interleave
#define BUFFER_SAMPLES   1024          // Number of ADC samples per DMA buffer (total, interleaved)
#define DMA_BUFFER_SIZE  (BUFFER_SAMPLES)

// -------------------- Global Variables --------------------
// Two buffers for double buffering
volatile uint16_t dma_buffer_A[DMA_BUFFER_SIZE];
volatile uint16_t dma_buffer_B[DMA_BUFFER_SIZE];

// Flags to indicate a DMA buffer is ready to send
volatile bool buffer_A_ready = false;
volatile bool buffer_B_ready = false;

// Indicates which buffer the DMA is currently filling
volatile bool use_buffer_A = true;

// DMA channel used for ADC transfers
uint dma_chan;

// A counter to keep track of samples in the current DMA transfer (for debugging, if desired)
volatile uint32_t sample_count = 0;

// For multi-channel round-robin sampling
volatile uint8_t current_adc_channel = 0;

// -------------------- DMA Completion Callback --------------------
void dma_handler() {
    // Clear the interrupt request.
    dma_hw->ints0 = 1u << dma_chan;

    // Mark the current buffer as ready.
    if (use_buffer_A) {
        buffer_A_ready = true;
    } else {
        buffer_B_ready = true;
    }
    // Swap buffers for the next DMA transfer.
    use_buffer_A = !use_buffer_A;
    sample_count = 0;  // Reset sample counter (optional)

    // Reconfigure the DMA channel to use the alternate buffer.
    volatile void *new_write_addr = use_buffer_A ? (volatile void*)dma_buffer_A : (volatile void*)dma_buffer_B;
    dma_channel_set_write_addr(dma_chan, new_write_addr, true);
}

// -------------------- Timer Callback for Channel Switching --------------------
bool timer_callback(struct repeating_timer *t) {
    // Alternate ADC channel in round-robin fashion.
    adc_select_input(current_adc_channel);
    current_adc_channel = (current_adc_channel + 1) % NUM_CHANNELS;
    return true; // Keep the timer repeating.
}

// -------------------- Main --------------------
int main() {
    // Initialize USB CDC for data output.
    stdio_init_all();
    // Wait a couple of seconds for USB enumeration.
    sleep_ms(2000);
    printf("Starting DMA-based multi-channel ADC sampling\r\n");

    // Initialize ADC hardware.
    adc_init();
    // Initialize ADC GPIO pins for channels. For example, GP26 for ADC0 and GP27 for ADC1.
    adc_gpio_init(26);   // ADC0 (channel 0)
    adc_gpio_init(27);   // ADC1 (channel 1)

    // Set up the ADC FIFO:
    adc_fifo_setup(
        true,   // Enable FIFO
        true,   // Enable DMA data request (DREQ)
        1,      // DREQ (trigger DMA when at least 1 sample is present)
        false,  // Do not shift the result
        false   // Do not enable ERR bit
    );

    // Start ADC in free-running mode.
    adc_run(true);

    // -------------------- Configure DMA --------------------
    // Claim an unused DMA channel.
    dma_chan = dma_claim_unused_channel(true);
    dma_channel_config cfg = dma_channel_get_default_config(dma_chan);
    channel_config_set_transfer_data_size(&cfg, DMA_SIZE_16);
    channel_config_set_read_increment(&cfg, false);  // Always read from the same ADC FIFO register.
    channel_config_set_write_increment(&cfg, true);  // Write sequentially to the buffer.
    channel_config_set_dreq(&cfg, DREQ_ADC);           // Use ADC's DREQ for pacing transfers.

    // Configure the DMA channel to transfer BUFFER_SAMPLES samples.
    dma_channel_configure(
        dma_chan,
        &cfg,
        dma_buffer_A,            // Initial write address (buffer A)
        &adc_hw->fifo,           // Read address: ADC FIFO
        DMA_BUFFER_SIZE,         // Number of transfers per buffer
        true                     // Start immediately
    );

    // Set up the DMA interrupt handler.
    dma_channel_set_irq0_enabled(dma_chan, true);
    irq_set_exclusive_handler(DMA_IRQ_0, dma_handler);
    irq_set_enabled(DMA_IRQ_0, true);

    // -------------------- Set up Timer for ADC Channel Switching --------------------
    struct repeating_timer timer;
    // The timer runs every 25 microseconds (i.e. 1,000,000 / 40,000 ≈ 25µs)
    if (!add_repeating_timer_us(-25, timer_callback, NULL, &timer)) {
        printf("Error adding timer callback\r\n");
        return 1;
    }

    // -------------------- Main Loop: USB Data Transfer --------------------
    while (true) {
        // Check if buffer A is ready.
        if (buffer_A_ready) {
            // Transmit buffer A as a binary block over USB.
            fwrite((const void *)dma_buffer_A, sizeof(uint16_t), DMA_BUFFER_SIZE, stdout);
            fflush(stdout);
            buffer_A_ready = false;
        }
        // Check if buffer B is ready.
        if (buffer_B_ready) {
            fwrite((const void *)dma_buffer_B, sizeof(uint16_t), DMA_BUFFER_SIZE, stdout);
            fflush(stdout);
            buffer_B_ready = false;
        }
        tight_loop_contents();
    }

    return 0;
}
