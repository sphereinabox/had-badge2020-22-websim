// constants:
// register names, bit encoding
var R0=0,R1=1,R2=2,R3=3,R4=4,R5=5,R6=6,R7=7,R8=8;
var R9=9,OUT=10,IN=11,JSR=12,PCL=13,PCM=14,PCH=15;

// status register has 

function new_state() {
    // return fresh state of entire machine
    var mem = [], code = [];
    mem.fill(0, 0, 256);
    code.fill(0, 0, 4096);
    return {
        // flags
        v:0,c:0,z:0,
        pc:0,
        sp:0,
        // 16 4-bit registers
        regs : [
            0,0,0,0,
            0,0,0,0,
            0,0,0,0,
            0,0,0,0],
        // 4096 12-bit instructions
        code : code,
        // 16 pages of 16 entires of 4-bit memory
        mem : mem
    };
}

function advance(state) {
    // return new state after advancing one clock
    var ns = Object.create(state);

    var opcode = state.code[state.pc];

    // increment program counter
    ns.pc = (state.pc + 1) & 0xFFF;

    return ns;
}
