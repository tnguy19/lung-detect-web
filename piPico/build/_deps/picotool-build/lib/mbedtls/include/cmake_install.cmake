# Install script for directory: /Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include

# Set the install prefix
if(NOT DEFINED CMAKE_INSTALL_PREFIX)
  set(CMAKE_INSTALL_PREFIX "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/build/_deps")
endif()
string(REGEX REPLACE "/$" "" CMAKE_INSTALL_PREFIX "${CMAKE_INSTALL_PREFIX}")

# Set the install configuration name.
if(NOT DEFINED CMAKE_INSTALL_CONFIG_NAME)
  if(BUILD_TYPE)
    string(REGEX REPLACE "^[^A-Za-z0-9_]+" ""
           CMAKE_INSTALL_CONFIG_NAME "${BUILD_TYPE}")
  else()
    set(CMAKE_INSTALL_CONFIG_NAME "Release")
  endif()
  message(STATUS "Install configuration: \"${CMAKE_INSTALL_CONFIG_NAME}\"")
endif()

# Set the component getting installed.
if(NOT CMAKE_INSTALL_COMPONENT)
  if(COMPONENT)
    message(STATUS "Install component: \"${COMPONENT}\"")
    set(CMAKE_INSTALL_COMPONENT "${COMPONENT}")
  else()
    set(CMAKE_INSTALL_COMPONENT)
  endif()
endif()

# Is this installation the result of a crosscompile?
if(NOT DEFINED CMAKE_CROSSCOMPILING)
  set(CMAKE_CROSSCOMPILING "FALSE")
endif()

# Set path to fallback-tool for dependency-resolution.
if(NOT DEFINED CMAKE_OBJDUMP)
  set(CMAKE_OBJDUMP "/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/objdump")
endif()

if(CMAKE_INSTALL_COMPONENT STREQUAL "Unspecified" OR NOT CMAKE_INSTALL_COMPONENT)
  file(INSTALL DESTINATION "${CMAKE_INSTALL_PREFIX}/include/mbedtls" TYPE FILE MESSAGE_NEVER PERMISSIONS OWNER_READ OWNER_WRITE GROUP_READ WORLD_READ FILES
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/aes.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/aesni.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/arc4.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/aria.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/asn1.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/asn1write.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/base64.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/bignum.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/blowfish.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/bn_mul.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/camellia.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/ccm.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/certs.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/chacha20.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/chachapoly.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/check_config.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/cipher.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/cipher_internal.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/cmac.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/compat-1.3.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/config.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/config_psa.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/constant_time.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/ctr_drbg.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/debug.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/des.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/dhm.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/ecdh.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/ecdsa.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/ecjpake.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/ecp.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/ecp_internal.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/entropy.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/entropy_poll.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/error.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/gcm.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/havege.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/hkdf.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/hmac_drbg.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/md.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/md2.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/md4.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/md5.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/md_internal.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/memory_buffer_alloc.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/net.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/net_sockets.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/nist_kw.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/oid.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/padlock.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/pem.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/pk.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/pk_internal.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/pkcs11.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/pkcs12.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/pkcs5.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/platform.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/platform_time.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/platform_util.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/poly1305.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/psa_util.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/ripemd160.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/rsa.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/rsa_internal.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/sha1.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/sha256.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/sha512.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/ssl.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/ssl_cache.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/ssl_ciphersuites.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/ssl_cookie.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/ssl_internal.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/ssl_ticket.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/threading.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/timing.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/version.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/x509.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/x509_crl.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/x509_crt.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/x509_csr.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/mbedtls/xtea.h"
    )
endif()

if(CMAKE_INSTALL_COMPONENT STREQUAL "Unspecified" OR NOT CMAKE_INSTALL_COMPONENT)
  file(INSTALL DESTINATION "${CMAKE_INSTALL_PREFIX}/include/psa" TYPE FILE MESSAGE_NEVER PERMISSIONS OWNER_READ OWNER_WRITE GROUP_READ WORLD_READ FILES
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/psa/crypto.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/psa/crypto_builtin_composites.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/psa/crypto_builtin_primitives.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/psa/crypto_compat.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/psa/crypto_config.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/psa/crypto_driver_common.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/psa/crypto_driver_contexts_composites.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/psa/crypto_driver_contexts_primitives.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/psa/crypto_extra.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/psa/crypto_platform.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/psa/crypto_se_driver.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/psa/crypto_sizes.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/psa/crypto_struct.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/psa/crypto_types.h"
    "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/lib/pico-sdk/lib/mbedtls/include/psa/crypto_values.h"
    )
endif()

string(REPLACE ";" "\n" CMAKE_INSTALL_MANIFEST_CONTENT
       "${CMAKE_INSTALL_MANIFEST_FILES}")
if(CMAKE_INSTALL_LOCAL_ONLY)
  file(WRITE "/Users/hilariogonzalez/School/EC463/lung-detect-web/piPico/build/_deps/picotool-build/lib/mbedtls/include/install_local_manifest.txt"
     "${CMAKE_INSTALL_MANIFEST_CONTENT}")
endif()
