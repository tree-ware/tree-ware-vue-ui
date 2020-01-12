<template>
  <div>
    <div class="mb-4">{{bytes.length}} bytes</div>
    <table class="font-mono whitespace-pre">
      <tr v-for="(address, index) in addresses" :key="index" class="hex-dump-row">
        <td class="pr-3">{{address}}</td>
        <td class="px-3">{{hexRows[index]}}</td>
        <td class="pl-3">{{asciiRows[index]}}</td>
      </tr>
    </table>
  </div>
</template>

<script lang="ts">
import "reflect-metadata";
import { Component, Prop, Vue } from "vue-property-decorator";

const BASE = 16;
const ADDRESS_WIDTH = 8;
const BYTE_AS_HEX_WIDTH = 2;
const BYTE_AS_ASCII_WIDTH = 1;
const ASCII_START = 32;
const ASCII_END = 126;

@Component
export default class TreeWareHexDump extends Vue {
  @Prop() bytes!: Uint8Array;

  beforeMount() {
    this.dump();
  }

  /** Populates addresses, hexRows, and asciiRows */
  private dump() {
    for (let i = 0; i < this.bytes.length; i += BASE) {
      this.addresses.push(toAddress(i));
      const rowBytes = this.bytes.slice(i, i + BASE);
      this.hexRows.push(this.getHexRow(rowBytes));
      this.asciiRows.push(this.getAsciiRow(rowBytes));
    }
  }

  private getHexRow(rowBytes: Uint8Array): string {
    const hexRow = new Array<string>(BASE);
    for (let [index, byte] of rowBytes.entries()) {
      hexRow[index] = toHex(byte);
    }
    addPaddingElementsTo(hexRow, rowBytes.length, BYTE_AS_HEX_WIDTH);
    return hexRow.join(" ");
  }

  private getAsciiRow(rowBytes: Uint8Array): string {
    const asciiRow = new Array<string>(BASE);
    for (let [index, byte] of rowBytes.entries()) {
      asciiRow[index] = toAscii(byte);
    }
    addPaddingElementsTo(asciiRow, rowBytes.length, BYTE_AS_ASCII_WIDTH);
    return asciiRow.join("");
  }

  private addresses: string[] = [];
  private hexRows: string[] = [];
  private asciiRows: string[] = [];
}

function toAddress(byteIndex: number): string {
  return (byteIndex).toString(BASE).padStart(ADDRESS_WIDTH, "0");
}

function toHex(byte: number): string {
  return byte.toString(BASE).padStart(BYTE_AS_HEX_WIDTH, "0");
}

function toAscii(byte: number): string {
  return byte >= ASCII_START && byte <= ASCII_END
    ? String.fromCharCode(byte)
    : ".";
}

function addPaddingElementsTo(
  row: string[],
  startIndex: number,
  paddingElementWidth: number
): void {
  if (startIndex >= row.length) return;
  const paddingElement = " ".repeat(paddingElementWidth);
  row.fill(paddingElement, startIndex);
}
</script>
