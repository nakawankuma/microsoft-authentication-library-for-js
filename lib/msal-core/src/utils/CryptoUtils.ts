/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Base64 } from "js-base64";
/**
 * @hidden
 */
export class CryptoUtils {

    /**
     * Creates a new random GUID - used to populate state?
     * @returns string (GUID)
     */
    static createNewGuid(): string {
        /*
         * RFC4122: The version 4 UUID is meant for generating UUIDs from truly-random or
         * pseudo-random numbers.
         * The algorithm is as follows:
         *     Set the two most significant bits (bits 6 and 7) of the
         *        clock_seq_hi_and_reserved to zero and one, respectively.
         *     Set the four most significant bits (bits 12 through 15) of the
         *        time_hi_and_version field to the 4-bit version number from
         *        Section 4.1.3. Version4
         *     Set all the other bits to randomly (or pseudo-randomly) chosen
         *     values.
         * UUID                   = time-low "-" time-mid "-"time-high-and-version "-"clock-seq-reserved and low(2hexOctet)"-" node
         * time-low               = 4hexOctet
         * time-mid               = 2hexOctet
         * time-high-and-version  = 2hexOctet
         * clock-seq-and-reserved = hexOctet:
         * clock-seq-low          = hexOctet
         * node                   = 6hexOctet
         * Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
         * y could be 1000, 1001, 1010, 1011 since most significant two bits needs to be 10
         * y values are 8, 9, A, B
         */

        const cryptoObj: Crypto = window.crypto; // for IE 11
        if (cryptoObj && cryptoObj.getRandomValues) {
            const buffer: Uint8Array = new Uint8Array(16);
            cryptoObj.getRandomValues(buffer);

            // buffer[6] and buffer[7] represents the time_hi_and_version field. We will set the four most significant bits (4 through 7) of buffer[6] to represent decimal number 4 (UUID version number).
            buffer[6] |= 0x40; // buffer[6] | 01000000 will set the 6 bit to 1.
            buffer[6] &= 0x4f; // buffer[6] & 01001111 will set the 4, 5, and 7 bit to 0 such that bits 4-7 == 0100 = "4".

            // buffer[8] represents the clock_seq_hi_and_reserved field. We will set the two most significant bits (6 and 7) of the clock_seq_hi_and_reserved to zero and one, respectively.
            buffer[8] |= 0x80; // buffer[8] | 10000000 will set the 7 bit to 1.
            buffer[8] &= 0xbf; // buffer[8] & 10111111 will set the 6 bit to 0.

            return CryptoUtils.decimalToHex(buffer[0]) + CryptoUtils.decimalToHex(buffer[1])
            + CryptoUtils.decimalToHex(buffer[2]) + CryptoUtils.decimalToHex(buffer[3])
            + "-" + CryptoUtils.decimalToHex(buffer[4]) + CryptoUtils.decimalToHex(buffer[5])
            + "-" + CryptoUtils.decimalToHex(buffer[6]) + CryptoUtils.decimalToHex(buffer[7])
            + "-" + CryptoUtils.decimalToHex(buffer[8]) + CryptoUtils.decimalToHex(buffer[9])
            + "-" + CryptoUtils.decimalToHex(buffer[10]) + CryptoUtils.decimalToHex(buffer[11])
            + CryptoUtils.decimalToHex(buffer[12]) + CryptoUtils.decimalToHex(buffer[13])
            + CryptoUtils.decimalToHex(buffer[14]) + CryptoUtils.decimalToHex(buffer[15]);
        }
        else {
            const guidHolder: string = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
            const hex: string = "0123456789abcdef";
            let r: number = 0;
            let guidResponse: string = "";
            for (let i: number = 0; i < 36; i++) {
                if (guidHolder[i] !== "-" && guidHolder[i] !== "4") {
                    // each x and y needs to be random
                    r = Math.random()  * 16 | 0;
                }
                if (guidHolder[i] === "x") {
                    guidResponse += hex[r];
                } else if (guidHolder[i] === "y") {
                    // clock-seq-and-reserved first hex is filtered and remaining hex values are random
                    r &= 0x3; // bit and with 0011 to set pos 2 to zero ?0??
                    r |= 0x8; // set pos 3 to 1 as 1???
                    guidResponse += hex[r];
                } else {
                    guidResponse += guidHolder[i];
                }
            }
            return guidResponse;
        }
    }

    /**
     * Decimal to Hex
     *
     * @param num
     */
    static decimalToHex(num: number): string {
        let hex: string = num.toString(16);
        while (hex.length < 2) {
            hex = "0" + hex;
        }
        return hex;
    }
    
    // See: https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#Solution_4_%E2%80%93_escaping_the_string_before_encoding_it

    /**
     * encoding string to base64 - platform specific check
     *
     * @param input
     */
    static base64Encode(input: string): string {
        return Base64.encode(input);
    }

    /**
     * decoding base64 token - platform specific check
     *
     * @param base64IdToken
     */
    static base64Decode(input: string): string {
        return Base64.decode(input);
    }

    /**
     * deserialize a string
     *
     * @param query
     */
    static deserialize(query: string): any {
        let match: Array<string>; // Regex for replacing addition symbol with a space
        const pl = /\+/g;
        const search = /([^&=]+)=([^&]*)/g;
        const decode = (s: string) => decodeURIComponent(s.replace(pl, " "));
        const obj: {} = {};
        match = search.exec(query);
        while (match) {
            obj[decode(match[1])] = decode(match[2]);
            match = search.exec(query);
        }
        return obj;
    }

}
