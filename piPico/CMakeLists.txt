# cmake_minimum_required(VERSION 3.13)

# # Set the Pico SDK path relative to your repo (or use an absolute path)
# set(PICO_SDK_PATH ${CMAKE_CURRENT_SOURCE_DIR}/lib/pico-sdk)
# message(STATUS "PICO_SDK_PATH is set to: ${PICO_SDK_PATH}")

# # Set target system details if necessary
# set(CMAKE_SYSTEM_PROCESSOR arm)

# # Include and initialize the Pico SDK
# include(${PICO_SDK_PATH}/pico_sdk_init.cmake)
# #include(${PICO_SDK_PATH}/pico_sdk_import.cmake)

# project(MyPicoProject C CXX ASM)

# pico_sdk_init()

# # Create the executable using your main.cpp
# add_executable(my_pico_program src/main.cpp)

# # Link include headers
# target_include_directories(my_pico_program PUBLIC
#     ${PICO_SDK_PATH}/src/rp2_common/hardware_adc/include
#     ${PICO_SDK_PATH}/src/rp2_common/hardware_dma/include
#     ${PICO_SDK_PATH}/src/rp2_common/hardware_timer/include
#     ${PICO_SDK_PATH}/src/rp2_common/pico_stdio_usb/include
# )

# # Link standard Pico libraries (including USB CDC and stdio)
# target_link_libraries(my_pico_program pico_stdlib)

# # Generate additional output files (UF2 for flashing)
# pico_add_extra_outputs(my_pico_program)

cmake_minimum_required(VERSION 3.13)

# Set the Pico SDK path relative to your repo (or use an absolute path)
set(PICO_SDK_PATH ${CMAKE_CURRENT_SOURCE_DIR}/lib/pico-sdk)
message(STATUS "PICO_SDK_PATH is set to: ${PICO_SDK_PATH}")

# Set target system details if necessary
set(CMAKE_SYSTEM_PROCESSOR arm)

# Include the Pico SDK import script (this sets up include directories, etc.)
include(${PICO_SDK_PATH}/pico_sdk_import.cmake)

project(MyPicoProject C CXX ASM)

# Initialize the Pico SDK (this adds required source files and include paths)
pico_sdk_init()

# Create the executable using your main.cpp
add_executable(my_pico_program src/main.cpp)

# Link standard Pico libraries along with hardware libraries required by your code
target_link_libraries(my_pico_program pico_stdlib hardware_adc hardware_dma hardware_timer pico_stdio_usb)

# Generate additional output files (UF2 for flashing)
pico_add_extra_outputs(my_pico_program)
