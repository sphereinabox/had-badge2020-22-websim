// constants:
// register names, bit encoding
var R0 = 0, R1 = 1, R2 = 2, R3 = 3, R4 = 4, R5 = 5, R6 = 6, R7 = 7, R8 = 8;
var R9 = 9, OUT = 10, IN = 11, JSR = 12, PCL = 13, PCM = 14, PCH = 15;

// status register has 

function new_state() {
    // return fresh state of entire machine
    var mem = [], code = [];
    mem.fill(0, 0, 256);
    code.fill(0, 0, 4096);
    return {
        // flags
        v: 0, c: 0, z: 0,
        pc: 0,
        sp: 0,
        // 16 4-bit registers
        regs: [
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0],
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

    var temp, temp_signed;

    var rx_val = ns.regs[RX];
    var ry_val = ns.regs[RY];
    var rx_val_signed = (rx_val & 0b1000) === 0 ? rx_val : rx_val - 16;
    var ry_val_signed = (ry_val & 0b1000) === 0 ? ry_val : ry_val - 16;


    switch ((op >> 8) & 0xF) {
        case 1:
            // ADD RX,RY
            temp = rx_val + ry_val;
            temp_signed = rx_val_signed + ry_val_signed;
            ns.regs[RX] = (temp) & 0xF;
            ns.c = (temp > 15 ? 1 : 0);
            ns.z = ((temp & 0xF) === 0 ? 1 : 0);
            ns.v = (-8 <= temp_signed && temp_signed <= 7 ? 0 : 1);
            break;
        case 2:
            // ADC RX,RY
            temp = rx_val + ry_val + state.c;
            temp_signed = rx_val_signed + ry_val_signed + state.c;
            ns.regs[RX] = (temp) & 0xF;
            ns.c = (temp > 15 ? 1 : 0);
            ns.z = ((temp & 0xF) === 0 ? 1 : 0);
            ns.v = (-8 <= temp_signed && temp_signed <= 7 ? 0 : 1);
            break;
        case 3:
            // SUB RX,RY
            temp = rx_val - ry_val;
            temp_signed = rx_val_signed - ry_val_signed;
            ns.regs[RX] = (temp) & 0xF;
            ns.c = (ry_val < rx_val ? 1 : 0);
            ns.z = ((temp & 0xF) === 0 ? 1 : 0);
            ns.v = (-8 <= temp_signed && temp_signed <= 7 ? 0 : 1);
            break;
        case 4:
            // SBB RX,RY
            temp = rx_val - ry_val - (state.c == 0 ? 1 : 0);
            temp_signed = rx_val_signed - ry_val_signed - (state.c == 0 ? 1 : 0);
            ns.regs[RX] = (temp) & 0xF;
            ns.c = (ry_val < rx_val - (state.c == 0 ? 1 : 0) ? 1 : 0);
            ns.z = ((temp & 0xF) === 0 ? 1 : 0);
            ns.v = (-8 <= temp_signed && temp_signed <= 7 ? 0 : 1);
            break;
        case 5:
            // OR RX,RY
            temp = rx_val | ry_val;
            ns.regs[RX] = temp;
            ns.z = (temp === 0 ? 1 : 0);
            break;
        case 6:
            // AND RX,RY
            temp = rx_val & ry_val;
            ns.regs[RX] = temp;
            ns.z = (temp === 0 ? 1 : 0);
            break;
        case 7:
            // XOR RX,RY
            temp = rx_val ^ ry_val;
            ns.regs[RX] = temp;
            ns.z = (temp === 0 ? 1 : 0);
            break;
        case 8:
            // MOV RX,RY
            ns.regs[RX] = ry_val;
            if (RX == JSR) {
                // TODO: jump subroutine to PCH/PCM/JSR
            }
            if (RX == PCL) {
                // TODO: jump long to PCH/PCM/PCL?
            }
            break;
        case 9:
            // MOV RX,#N
            ns.regs[RX] = RY;
            if (RX == JSR) {
                // TODO: jump subroutine to PCH/PCM/JSR
            }
            if (RX == PCL) {
                // TODO: jump long to PCH/PCM/PCL?
            }
            break;
        case 0xA:
            // MOV [XY],R0
            break;
        case 0xB:
            // MOV R0,[XY]
            break;
        case 0xC:
            // MOV [NN],R0
            break;
        case 0xD:
            // MOV R0,[NN]
            break;
        case 0xE:
            // MOV PC,NN
            break;
        case 0xF:
            // JR NN
            break;
        case 0:
            switch ((op >> 4) & 0xF) {
                case 0:
                    // CP R0,N
                    break;
                case 1:
                    // ADD R0,N
                    break;
                case 2:
                    // INC RY
                    break;
                case 3:
                    // DEC RY
                    break;
                case 4:
                    // DSZ RY
                    break;
                case 5:
                    // OR R0,N
                    break;
                case 6:
                    // AND R0,N
                    break;
                case 7:
                    // AND R0,N
                    break;
                case 8:
                    // XOR R0,N
                    break;
                case 9:
                    // EXR N
                    break;
                case 0xA:
                    // BIT RG,M
                    break;
                case 0xB:
                    // BCLR RG,M
                    break;
                case 0xC:
                    // BTG RG,M
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
