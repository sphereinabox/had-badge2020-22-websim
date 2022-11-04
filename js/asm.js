var REGISTER_NAMES = [
    "R0", "R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8", "R9", "R10", "R11", "JSR", "PCL", "PCM", "PCH"];
var REGISTER_NAMES_ALT = [
    "R0", "R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8", "OUT", "IN", "R11", "JSR", "PCL", "PCM", "PCH"];

// unsigned number literals, up to 255/0xff
var re_number = /(?:2_|0b|0B)(?<binary>[01]{1,8})|(?:16_|0x|0X)(?<hex>[0-9A-Fa-f]{1,2})|(?:10_)?(?<decimal>[0-9]{1,3})/;
// signed decimal number literal
var re_s8 = /-[0-9]{1,3}/

function format_number(num) {
    if (num <= 15) {
        // binary, like 2_1010
        return "2_" + num.toString(2).padStart(4, "0");
        // decimal like 15
        // return num.toString(10);
        // hex like 0xA
        // return "0x" + num.toString(16).toUpperCase();
    } else {
        // binary, like 2_10100000
        // return "2_" + num.toString(2).padStart(8, "0");
        // decimal like 255
        // return num.toString(10);
        // hex like 0xFA
        return "0x" + num.toString(16).padStart(2,"0").toUpperCase();
    }
}

function format_s8(num) {
    return num.toString(10);
}

function parse_number(str) {
    var match = str.match(re_number);
    if (match.groups.binary)
        return Number.parseInt(match.groups.binary, 2);
    if (match.groups.decimal)
        return Number.parseInt(match.groups.decimal, 10);
    if (match.groups.hex)
        return Number.parseInt(match.groups.hex, 16);
    throw `Number "{$str}" doesn't match expected format`;
}

function disasm(opcode) {
    var RX_num = (opcode >> 4) & 0xF;
    var RY_num = opcode & 0xF;
    var NN = (RX_num << 4) | RY_num;
    switch ((opcode >> 4) & 0xF) {
        case 1:
            return "ADD " + REGISTER_NAMES[RX_num] + "," + REGISTER_NAMES[RY_num];
        case 2:
            return "ADC " + REGISTER_NAMES[RX_num] + "," + REGISTER_NAMES[RY_num];
        case 3:
            return "SUB " + REGISTER_NAMES[RX_num] + "," + REGISTER_NAMES[RY_num];
        case 4:
            return "SBB " + REGISTER_NAMES[RX_num] + "," + REGISTER_NAMES[RY_num];
        case 5:
            return "OR " + REGISTER_NAMES[RX_num] + "," + REGISTER_NAMES[RY_num];
        case 6:
            return "AND " + REGISTER_NAMES[RX_num] + "," + REGISTER_NAMES[RY_num];
        case 7:
            return "XOR " + REGISTER_NAMES[RX_num] + "," + REGISTER_NAMES[RY_num];
        case 8:
            return "MOV " + REGISTER_NAMES[RX_num] + "," + REGISTER_NAMES[RY_num];
        case 9:
            return "MOV " + REGISTER_NAMES[RX_num] + "," + format_number(RY_num);
        case 0xA:
            return "MOV [" + REGISTER_NAMES[RX_num] + ":" + REGISTER_NAMES[RY_num] + "],R0";
        case 0xB:
            return "MOV R0,[" + REGISTER_NAMES[RX_num] + ":" + REGISTER_NAMES[RY_num] + "]";
        case 0xC:
            return "MOV [" + format_number(NN) + "],R0";
        case 0xD:
            return "MOV R0,[" + format_number(NN) + "]";
        case 0xE:
            return "MOV PC," + format_number(NN);
        case 0xF:
            return "JR " + format_s8(NN);
        case 0:
            switch ((opcode >> 4) & 0xF) {
                case 0:
                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                case 6:
                case 7:
                case 8:
                case 0xA:
                case 0xB:
                case 0xC:
                case 0xD:
                case 0xE:
                case 0xF:
            }
    }
}