Instructions from the pipico website:
install the following(this is what doesn't work on new macs, and the existing releases from the ARM website don't have nosys.specs):

sudo apt install cmake python3 build-essential gcc-arm-none-eabi libnewlib-arm-none-eabi libstdc++-arm-none-eabi-newlib

Or with the Raspberry Pi Pico SDK as a submodule :

Clone the SDK as a submodule called pico-sdk

**Setup a CMakeLists.txt like(the one already in this directory is this way):

cmake_minimum_required(VERSION 3.13...3.27)

#initialize pico-sdk from submodule
#note: this must happen before project()
include(pico-sdk/pico_sdk_init.cmake)

project(my_project)

#initialize the Raspberry Pi Pico SDK
pico_sdk_init()

#add executable
add_executable(hello_world
    hello_world.c
)

#Add pico_stdlib library which aggregates commonly used features
target_link_libraries(hello_world pico_stdlib)

#create map/bin/hex/uf2 file in addition to ELF.
pico_add_extra_outputs(hello_world)

**code will need the headers:

#include <stdio.h>
#include "pico/stdlib.h"

int main() {
    stdio_init_all();
    printf("Hello, world!\n");
    return 0;
}

**Finally, in the project directory build it with(may need to remove and recreate build dir):
$ mkdir build
$ cd build
$ cmake -DPICO_BOARD=pico_w ..
$ make my_pico_program
