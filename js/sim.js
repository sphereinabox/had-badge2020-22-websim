// constants:
// register names, bit encoding
var R0 = 0, R1 = 1, R2 = 2, R3 = 3, R4 = 4, R5 = 5, R6 = 6, R7 = 7, R8 = 8;
var R9 = 9, OUT = 10, IN = 11, JSR = 12, PCL = 13, PCM = 14, PCH = 15;
var WRFLAGS = 0xF3;

function new_state() {
    // return fresh state of entire machine
    var mem = Array(256), code = Array(4096);
    mem.fill(0, 0, 256);
    code.fill(0, 0, 4096);
    return {
        // flags
        v: 0, c: 0, z: 0,
        pc: 0,
        sp: 0,
        // 4096 12-bit instructions
        code: code,
        // 16 pages of 16 entires of 4-bit memory
        mem: mem
    };
}

function advance(state) {
    if (state.sp === 0b110 ||
        state.sp === 0b111) {
        // don't advance after stack overflow or underflow
        return state;
    }

    // return new state after advancing one clock
    var ns = Object.create(state);

    var op = state.code[state.pc];

    // increment program counter
    ns.pc = (state.pc + 1) & 0xFFF;

    // extract common opcode things
    var RX = (op >> 4) & 0xF;
    var RY = op & 0xF;
    var N = op & 0xF;
    var NN = op & 0xFF; // ?
    var RG = (op >> 2) & 0b11;
    var M = op & 0b11;

    var temp, temp_signed;

    var rx_val = ns.mem[RX];
    var ry_val = ns.mem[RY];
    var rx_val_signed = (rx_val & 0b1000) === 0 ? rx_val : rx_val - 16;
    var ry_val_signed = (ry_val & 0b1000) === 0 ? ry_val : ry_val - 16;


    switch ((op >> 8) & 0xF) {
        case 1:
            // ADD RX,RY
            temp = rx_val + ry_val;
            temp_signed = rx_val_signed + ry_val_signed;
            ns.mem[RX] = (temp) & 0xF;
            ns.c = (temp > 15 ? 1 : 0);
            ns.z = ((temp & 0xF) === 0 ? 1 : 0);
            ns.v = (-8 <= temp_signed && temp_signed <= 7 ? 0 : 1);
            break;
        case 2:
            // ADC RX,RY
            temp = rx_val + ry_val + state.c;
            temp_signed = rx_val_signed + ry_val_signed + state.c;
            ns.mem[RX] = (temp) & 0xF;
            ns.c = (temp > 15 ? 1 : 0);
            ns.z = ((temp & 0xF) === 0 ? 1 : 0);
            ns.v = (-8 <= temp_signed && temp_signed <= 7 ? 0 : 1);
            break;
        case 3:
            // SUB RX,RY
            temp = rx_val - ry_val;
            temp_signed = rx_val_signed - ry_val_signed;
            ns.mem[RX] = (temp) & 0xF;
            ns.c = (ry_val < rx_val ? 1 : 0);
            ns.z = ((temp & 0xF) === 0 ? 1 : 0);
            ns.v = (-8 <= temp_signed && temp_signed <= 7 ? 0 : 1);
            break;
        case 4:
            // SBB RX,RY
            temp = rx_val - ry_val - (state.c == 0 ? 1 : 0);
            temp_signed = rx_val_signed - ry_val_signed - (state.c == 0 ? 1 : 0);
            ns.mem[RX] = (temp) & 0xF;
            ns.c = (ry_val < rx_val - (state.c == 0 ? 1 : 0) ? 1 : 0);
            ns.z = ((temp & 0xF) === 0 ? 1 : 0);
            ns.v = (-8 <= temp_signed && temp_signed <= 7 ? 0 : 1);
            break;
        case 5:
            // OR RX,RY
            temp = rx_val | ry_val;
            ns.mem[RX] = temp;
            ns.z = (temp === 0 ? 1 : 0);
            break;
        case 6:
            // AND RX,RY
            temp = rx_val & ry_val;
            ns.mem[RX] = temp;
            ns.z = (temp === 0 ? 1 : 0);
            break;
        case 7:
            // XOR RX,RY
            temp = rx_val ^ ry_val;
            ns.mem[RX] = temp;
            ns.z = (temp === 0 ? 1 : 0);
            break;
        case 8:
            // MOV RX,RY
            ns.mem[RX] = ry_val;
            if (RX == JSR) {
                // TODO: jump subroutine to PCH/PCM/JSR
            }
            if (RX == PCL) {
                // TODO: jump long to PCH/PCM/PCL?
            }
            break;
        case 9:
            // MOV RX,#N
            ns.mem[RX] = RY;
            if (RX == JSR) {
                // TODO: jump subroutine to PCH/PCM/JSR
            }
            if (RX == PCL) {
                // TODO: jump long to PCH/PCM/PCL?
            }
            break;
        case 0xA:
            // MOV [XY],R0
            temp = (state.mem[RX] << 4) | state.mem[RY]
            ns.mem[temp] = state.mem[R0];
            break;
        case 0xB:
            // MOV R0,[XY]
            temp = (state.mem[RX] << 4) | state.mem[RY]
            ns.mem[R0] = state.mem[temp];
            break;
        case 0xC:
            // MOV [NN],R0
            temp = (RX << 4) | RY
            ns.mem[temp] = state.mem[R0];
            break;
        case 0xD:
            // MOV R0,[NN]
            temp = (RX << 4) | RY;
            ns.mem[R0] = state.mem[temp];
            break;
        case 0xE:
            // MOV PC,NN
            ns.mem[PCH] = RX;
            ns.mem[PCM] = RY;
            break;
        case 0xF:
            // JR NN
            temp = (RX << 4) | RY;
            if (temp & 0x80 != 0) {
                // sign extend
                temp |= 0xF00;
            }
            ns.pc = 0xFFF & (ns.pc + temp);
            break;
        case 0:
            switch ((op >> 4) & 0xF) {
                case 0:
                    // CP R0,N
                    temp = state.mem[R0] - RY;
                    ns.z = temp === 0 ? 1 : 0;
                    ns.c = temp >= 0 ? 1 : 0;
                    break;
                case 1:
                    // ADD R0,N
                    temp = state.mem[R0] + RY;
                    ns.mem[R0] = temp & 0xF;
                    ns.z = ns.mem[R0] === 0 ? 1 : 0;
                    ns.c = temp > 0xF ? 1 : 0;
                    break;
                case 2:
                    // INC RY
                    temp = state.mem[RY] + 1
                    ns.mem[RY] = temp & 0xF;
                    ns.z = ns.mem[RY] === 0 ? 1 : 0;
                    ns.c = temp > 0xF ? 1 : 0;
                    break;
                case 3:
                    // DEC RY
                    temp = 0xF & (state.mem[RY] + 0b1111);
                    ns.mem[RY] = temp;
                    ns.z = temp === 0 ? 1 : 0;
                    ns.c = temp === 0b1111 ? 0 : 1;
                    break;
                case 4:
                    // DSZ RY
                    temp = 0xF & (state.mem[RY] + 0b1111);
                    ns.mem[RY] = temp;
                    if (temp === 0) {
                        ns.pc = 0xFFF & (ns.pc + 1);
                    }
                    break;
                case 5:
                    // OR R0,N
                    temp = state.mem[R0] | RY;
                    ns.mem[R0] = temp;
                    ns.c = 1;
                    ns.z = temp === 0 ? 1 : 0;
                    break;
                case 6:
                    // AND R0,N
                    temp = state.mem[R0] & RY;
                    ns.mem[R0] = temp;
                    ns.c = 0;
                    ns.z = temp === 0 ? 1 : 0;
                    break;
                case 7:
                    // XOR R0,N
                    temp = state.mem[R0] ^ RY;
                    ns.mem[R0] = temp;
                    ns.c = state.c === 0 ? 1 : 0;
                    ns.z = temp === 0 ? 1 : 0;
                    break;
                case 8:
                    // EXR N
                    var c = RY === 0 ? 16 : RY;
                    for (var i = 0; i < c; i++) {
                        ns.mem[i] = state.mem[0x0E + i];
                        ns.mem[0x0E + i] = state.mem[i];
                    }
                    break;
                case 9:
                    // BIT RG,M
                    temp = state.mem[RG];
                    if (RG == 3) {
                        // WRFLAGS bit 1
                        if (state.mem[WRFLAGS] & 0x2 != 0) {
                            // alternate IN location
                            temp = state.mem[0xFB]; // Should this be FA?
                        } else {
                            // IN
                            temp = state.mem[0x0B];
                        }
                    }
                    ns.z = ((temp & (1 << M)) === 0) ? 1 : 0;
                    break;
                case 0xA:
                    // BSET RG,M
                    temp = RG;
                    if (RG == 3) {
                        // WRFLAGS bit 1
                        if ((state.mem[WRFLAGS] & 0x2) != 0) {
                            // alternate OUT location
                            temp = 0xFA;
                        } else {
                            // OUT
                            temp = 0x0A;
                        }
                    }
                    ns.mem[temp] = ns.mem[temp] | (1 << M);
                    break;
                case 0xB:
                    // BCLR RG,M
                    temp = RG;
                    if (RG == 3) {
                        // WRFLAGS bit 1
                        if ((state.mem[WRFLAGS] & 0x2) != 0) {
                            // alternate OUT location
                            temp = 0xFA;
                        } else {
                            // OUT
                            temp = 0x0A;
                        }
                    }
                    ns.mem[temp] = ns.mem[temp] & (0xF ^ (1 << M));
                    break;
                case 0xC:
                    // BTG RG,M
                    temp = RG;
                    if (RG == 3) {
                        // WRFLAGS bit 1
                        if ((state.mem[WRFLAGS] & 0x2) != 0) {
                            temp = 0xFA;
                        } else {
                            temp = 0x0A;
                        }
                    }
                    ns.mem[temp] = ns.mem[temp] ^ (1 << M);
                    break;
                case 0xD:
                    // RRC RY
                    break;
                case 0xE:
                    // RET R0,N
                    break;
                case 0xF:
                    // SKIP F,M
                    break;

            }
            break;
    }

    return ns;
}
