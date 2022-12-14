var test_state = null;
var all_tests = [];

function test_setup() {
    test_state = {
        state: new_state(),
        state_after: null,
        test_pass: true
    };
}

function pp(n) {
    if (typeof (n) == 'string')
        return n;
    // return 0bNNNN_NNNN_NNNN formatted number n
    return ('0b' +
        ((n & 0xF00) >> 8).toString(2).padStart(4, '0') + '_' +
        ((n & 0x0F0) >> 4).toString(2).padStart(4, '0') + '_' +
        (n & 0xF).toString(2).padStart(4, '0'));
}

function assert_equal(a, b, msg) {
    if (a === b) {

    } else {
        console.trace(pp(a), pp(b), msg);
        // console.trace(a, b, msg);
        test_state.test_pass = false;
    }
}

function add_test(name, test_func) {
    all_tests.push({
        name: name,
        func: test_func
    });
}

function test_advance() {
    test_state.state_after = advance(test_state.state);
}

// add_test("hello", function(){
//     assert_equal(2,2,"Number literals should match");
// });

add_test("NOP", function () {
    // MOV R0 R0
    test_state.state.pc = 0x123;
    test_state.state.code[0x123] = 0b1000_0000_0000;

    test_advance();

    // verify instruction pointer advanced
    assert_equal(test_state.state_after.pc, 0x124);
    // verify flags still clear
    assert_equal(test_state.state_after.c, 0);
    assert_equal(test_state.state_after.z, 0);
    assert_equal(test_state.state_after.v, 0);
});

add_test("NOP", function () {
    // MOV R0 R0
    test_state.state.code[0] = 0b1000_0000_0000;
    // set flags
    test_state.state.c = 1;
    test_state.state.z = 1;
    test_state.state.v = 1;

    test_advance();

    // verify flags still set
    assert_equal(test_state.state_after.c, 1);
    assert_equal(test_state.state_after.z, 1);
    assert_equal(test_state.state_after.v, 1);
});

add_test("NOP", function () {
    // MOV R0 R0
    test_state.state.pc = 0xFFF;
    test_state.state.code[0xFFF] = 0b1000_0000_0000;

    test_advance();

    // verify instruction pointer advanced, wrapping around
    assert_equal(test_state.state_after.pc, 0x000);
});

add_test("NOP", function () {
    // MOV R0 R0
    test_state.state.code[0xFFF] = 0b1000_0000_0000;
    // set after stack overflow
    test_state.state.sp = 0b110;

    test_advance();

    // verify instruction pointer didn't advance
    assert_equal(test_state.state_after.pc, 0x000);
});

add_test("NOP", function () {
    // MOV R0 R0
    test_state.state.code[0xFFF] = 0b1000_0000_0000;
    // set after stack underflow
    test_state.state.sp = 0b111;

    test_advance();

    // verify instruction pointer didn't advance
    assert_equal(test_state.state_after.pc, 0x000);
});

add_test("op1 ADD R2,R0", function () {
    // ADD RX,RY
    test_state.state.code[0] = 0b0001_0010_0000;
    test_state.state.mem[R0] = 0b1011;
    test_state.state.mem[R2] = 0b0111;
    test_advance();
    assert_equal(test_state.state_after.mem[R2], 0b0010);
    assert_equal(test_state.state_after.c, 1);
    assert_equal(test_state.state_after.z, 0);
    assert_equal(test_state.state_after.v, 0);
});

add_test("op1 ADD R2,R0", function () {
    // ADD RX,RY
    test_state.state.code[0] = 0b0001_0010_0000;
    test_state.state.mem[R0] = 0b0001;
    test_state.state.mem[R2] = 0b1111;
    test_advance();
    assert_equal(test_state.state_after.mem[R2], 0b0000);
    assert_equal(test_state.state_after.c, 1);
    assert_equal(test_state.state_after.z, 1);
    assert_equal(test_state.state_after.v, 0);
});

add_test("op1 ADD R2,R0", function () {
    // ADD RX,RY
    test_state.state.code[0] = 0b0001_0010_0000;
    test_state.state.mem[R0] = 0b1001;
    test_state.state.mem[R2] = 0b1110;
    test_advance();
    assert_equal(test_state.state_after.mem[R2], 0b0111);
    assert_equal(test_state.state_after.c, 1);
    assert_equal(test_state.state_after.z, 0);
    assert_equal(test_state.state_after.v, 1);
});

add_test("op2 ADC", function () {
    // ADC R1,R7
    test_state.state.code[0] = 0b0010_0001_0111;
    test_state.state.mem[R1] = 0b0100;
    test_state.state.mem[R7] = 0b1011;
    test_state.state.c = 1;
    test_advance();
    assert_equal(test_state.state_after.mem[R1], 0b0000);
    assert_equal(test_state.state_after.c, 1);
    assert_equal(test_state.state_after.z, 1);
    assert_equal(test_state.state_after.v, 0);
});

add_test("op3 SUB ex1", function () {
    // SUB R6,R2
    test_state.state.code[0] = 0b0011_0110_0010;
    test_state.state.mem[R2] = 0b1001;
    test_state.state.mem[R6] = 0b1111;
    test_advance();
    assert_equal(test_state.state_after.mem[R6], 0b0110);
    assert_equal(test_state.state_after.c, 1);
    assert_equal(test_state.state_after.z, 0);
    assert_equal(test_state.state_after.v, 0);
});

add_test("op3 SUB ex2", function () {
    // SUB R10,R4
    test_state.state.code[0] = 0b0011_1010_0100;
    test_state.state.mem[R4] = 0b0111;
    test_state.state.mem[OUT] = 0b0101;
    test_advance();
    assert_equal(test_state.state_after.mem[OUT], 0b1110);
    assert_equal(test_state.state_after.c, 0);
    assert_equal(test_state.state_after.z, 0);
    assert_equal(test_state.state_after.v, 0);
});

add_test("op3 SBB", function () {
    // SBB R5,R3
    test_state.state.code[0] = 0b0100_0101_0011;
    test_state.state.mem[R5] = 0b1110;
    test_state.state.mem[R3] = 0b0011;
    test_state.state.c = 0;
    test_advance();
    assert_equal(test_state.state_after.mem[R5], 0b1010);
    assert_equal(test_state.state_after.c, 1);
    assert_equal(test_state.state_after.z, 0);
    assert_equal(test_state.state_after.v, 0);
});

add_test("op4 SBB", function () {
    // SBB R6,R7
    test_state.state.code[0] = 0b0100_0110_0111;
    test_state.state.mem[R6] = 0b0110;
    test_state.state.mem[R7] = 0b1110;
    test_state.state.c = 1;
    test_advance();
    assert_equal(test_state.state_after.mem[R6], 0b1000);
    assert_equal(test_state.state_after.c, 0);
    assert_equal(test_state.state_after.z, 0);
    assert_equal(test_state.state_after.v, 1);
});

add_test("op5 OR", function () {
    // OR R0,R7
    test_state.state.code[0] = 0b0101_0000_0111;
    test_state.state.mem[R0] = 0b0101;
    test_state.state.mem[R7] = 0b1101;
    test_state.state.c = 0;
    test_state.state.z = 1;
    test_state.state.v = 0;
    test_advance();
    assert_equal(test_state.state_after.mem[R0], 0b1101);
    assert_equal(test_state.state_after.c, 0);
    assert_equal(test_state.state_after.z, 0);
    assert_equal(test_state.state_after.v, 0);
});

add_test("op6 AND", function () {
    // AND R13,R12
    test_state.state.code[0] = 0b0110_1010_1011;
    test_state.state.mem[OUT] = 0b0111;
    test_state.state.mem[IN] = 0b1110;
    test_state.state.c = 0;
    test_state.state.z = 1;
    test_state.state.v = 0;
    test_advance();
    assert_equal(test_state.state_after.mem[OUT], 0b0110);
    assert_equal(test_state.state_after.c, 0);
    assert_equal(test_state.state_after.z, 0);
    assert_equal(test_state.state_after.v, 0);
});

add_test("op7 XOR", function () {
    // XOR R8,R3
    test_state.state.code[0] = 0b0111_1000_0011;
    test_state.state.mem[R8] = 0b0110;
    test_state.state.mem[R3] = 0b1100;
    test_state.state.c = 0;
    test_state.state.z = 1;
    test_state.state.v = 0;
    test_advance();
    assert_equal(test_state.state_after.mem[R8], 0b1010);
    assert_equal(test_state.state_after.c, 0);
    assert_equal(test_state.state_after.z, 0);
    assert_equal(test_state.state_after.v, 0);
});

add_test("op8 MOV", function () {
    // MOV R6,R5
    test_state.state.code[0] = 0b1000_0110_0101;
    test_state.state.mem[R6] = 0b1110;
    test_state.state.mem[R5] = 0b0010;
    test_state.state.c = 0;
    test_state.state.z = 0;
    test_state.state.v = 0;
    test_advance();
    assert_equal(test_state.state_after.mem[R6], 0b0010);
    assert_equal(test_state.state_after.c, 0);
    assert_equal(test_state.state_after.z, 0);
    assert_equal(test_state.state_after.v, 0);
});

add_test("op9 MOV", function () {
    // MOV R9,7
    test_state.state.code[0] = 0b1001_1001_0111;
    test_state.state.mem[R9] = 0b1010;
    test_state.state.c = 0;
    test_state.state.z = 0;
    test_state.state.v = 0;
    test_advance();
    assert_equal(test_state.state_after.mem[R9], 0b0111);
    assert_equal(test_state.state_after.c, 0);
    assert_equal(test_state.state_after.z, 0);
    assert_equal(test_state.state_after.v, 0);
});

add_test("op10 MOV", function () {
    // MOV [R6:R4],R0
    test_state.state.code[0] = 0b1010_1001_0100;
    test_state.state.mem[R0] = 0b1111;
    test_state.state.mem[R9] = 0b0001;
    test_state.state.mem[R4] = 0b0010;
    test_state.state.mem[0x12] = 0b0101;
    test_state.state.c = 0;
    test_state.state.z = 0;
    test_state.state.v = 0;
    test_advance();
    assert_equal(test_state.state_after.mem[0x12], 0b1111);
    assert_equal(test_state.state_after.c, 0);
    assert_equal(test_state.state_after.z, 0);
    assert_equal(test_state.state_after.v, 0);
});

add_test("op11 MOV", function () {
    // MOV R0,[R4,R7]
    test_state.state.code[0] = 0b1011_0100_0111;
    test_state.state.mem[R0] = 0b0011;
    test_state.state.mem[R4] = 0b0101;
    test_state.state.mem[R7] = 0b1010;
    test_state.state.mem[0x5A] = 0b1110;
    test_state.state.c = 0;
    test_state.state.z = 0;
    test_state.state.v = 0;
    test_advance();
    assert_equal(test_state.state_after.mem[R0], 0b1110);
    assert_equal(test_state.state_after.c, 0);
    assert_equal(test_state.state_after.z, 0);
    assert_equal(test_state.state_after.v, 0);
});

add_test("op12 MOV", function () {
    // MOV [0x19],R0
    test_state.state.code[0] = 0b1100_0001_1001;
    test_state.state.mem[R0] = 0b1001;
    test_state.state.mem[0x19] = 0b0111;
    test_state.state.c = 0;
    test_state.state.z = 0;
    test_state.state.v = 0;
    test_advance();
    assert_equal(test_state.state_after.mem[0x19], 0b1001);
    assert_equal(test_state.state_after.c, 0);
    assert_equal(test_state.state_after.z, 0);
    assert_equal(test_state.state_after.v, 0);
});

add_test("op13 MOV", function () {
    // MOV R0,[0xE2]
    test_state.state.code[0] = 0b1101_1110_0010;
    test_state.state.mem[R0] = 0b0011;
    test_state.state.mem[0xE2] = 0b1110;
    test_state.state.c = 0;
    test_state.state.z = 0;
    test_state.state.v = 0;
    test_advance();
    assert_equal(test_state.state_after.mem[R0], 0b1110);
    assert_equal(test_state.state_after.c, 0);
    assert_equal(test_state.state_after.z, 0);
    assert_equal(test_state.state_after.v, 0);
});

add_test("op14 MOV", function () {
    // MOV PC,0x31
    test_state.state.code[0] = 0b1110_0011_0001;
    test_state.state.mem[PCM] = 0b0110;
    test_state.state.mem[PCH] = 0b1010;
    test_state.state.c = 0;
    test_state.state.z = 0;
    test_state.state.v = 0;
    test_advance();
    assert_equal(test_state.state_after.mem[PCM], 0b0001);
    assert_equal(test_state.state_after.mem[PCH], 0b0011);
    assert_equal(test_state.state_after.c, 0);
    assert_equal(test_state.state_after.z, 0);
    assert_equal(test_state.state_after.v, 0);
});

add_test("op15 JR", function () {
    // JR -3
    test_state.state.code[0b0000_0100_0000] = 0b1111_1111_1101;
    test_state.state.pc = 0b0000_0100_0000;
    test_state.state.c = 0;
    test_state.state.z = 0;
    test_state.state.v = 0;
    test_advance();
    assert_equal(test_state.state_after.pc, 0b0000_0011_1110);
    assert_equal(test_state.state_after.c, 0);
    assert_equal(test_state.state_after.z, 0);
    assert_equal(test_state.state_after.v, 0);
});

add_test("op0.0 CP", function () {
    // CP R0,5
    test_state.state.code[0] = 0b0000_0000_0101;
    test_state.state.mem[R0] = 0b0101;
    test_state.state.c = 0;
    test_state.state.z = 0;
    test_state.state.v = 0;
    test_advance();
    assert_equal(test_state.state_after.mem[R0], 0b0101);
    assert_equal(test_state.state_after.c, 1);
    assert_equal(test_state.state_after.z, 1);
    assert_equal(test_state.state_after.v, 0);
});

add_test("op0.1 ADD", function () {
    // ADD R0,14
    test_state.state.code[0] = 0b0000_0001_1110;
    test_state.state.mem[R0] = 0b0010;
    test_state.state.c = 0;
    test_state.state.z = 0;
    test_state.state.v = 0;
    test_advance();
    assert_equal(test_state.state_after.mem[R0], 0b0000);
    assert_equal(test_state.state_after.c, 1);
    assert_equal(test_state.state_after.z, 1);
    assert_equal(test_state.state_after.v, 0);
});

add_test("op0.2 INC RY", function () {
    // INC R3
    test_state.state.code[0] = 0b0000_0010_0011;
    test_state.state.mem[R3] = 0b1111;
    test_state.state.c = 0;
    test_state.state.z = 0;
    test_state.state.v = 0;
    test_advance();
    assert_equal(test_state.state_after.mem[R3], 0b0000);
    assert_equal(test_state.state_after.c, 1);
    assert_equal(test_state.state_after.z, 1);
    assert_equal(test_state.state_after.v, 0);
});

add_test("op0.3 DEC RY", function () {
    // DEC R8
    test_state.state.code[0] = 0b0000_0011_1000;
    test_state.state.mem[R8] = 0b0010;
    test_state.state.c = 0;
    test_state.state.z = 0;
    test_state.state.v = 0;
    test_advance();
    assert_equal(test_state.state_after.mem[R8], 0b0001);
    assert_equal(test_state.state_after.c, 1); // p23 unclear, text says will set flag but value shown is with flag reset
    assert_equal(test_state.state_after.z, 0);
    assert_equal(test_state.state_after.v, 0);
});

add_test("op0.4 DSZ RY", function () {
    // DSZ R3
    var pc = 0b1010_1000_0000;
    test_state.state.pc = pc;
    test_state.state.code[pc] = 0b0000_0100_0011;
    test_state.state.mem[R3] = 0b0001;
    test_state.state.c = 0;
    test_state.state.z = 0;
    test_state.state.v = 0;
    test_advance();
    assert_equal(test_state.state_after.mem[R3], 0b0000);
    assert_equal(test_state.state_after.pc, 0b1010_1000_0010);
    assert_equal(test_state.state_after.c, 0);
    assert_equal(test_state.state_after.z, 0);
    assert_equal(test_state.state_after.v, 0);
});

add_test("op0.5 OR R0,N", function () {
    // OR R0,6
    test_state.state.code[0] = 0b0000_0101_0110;
    test_state.state.mem[R0] = 0b0011;
    test_state.state.c = 0;
    test_state.state.z = 0;
    test_state.state.v = 0;
    test_advance();
    assert_equal(test_state.state_after.mem[R0], 0b0111);
    assert_equal(test_state.state_after.c, 1);
    assert_equal(test_state.state_after.z, 0);
    assert_equal(test_state.state_after.v, 0);
});

add_test("op0.6 AND R0,N", function () {
    // AND R0,10
    test_state.state.code[0] = 0b0000_0110_1010;
    test_state.state.mem[R0] = 0b1100;
    test_state.state.c = 0;
    test_state.state.z = 0;
    test_state.state.v = 0;
    test_advance();
    assert_equal(test_state.state_after.mem[R0], 0b1000);
    assert_equal(test_state.state_after.c, 0);
    assert_equal(test_state.state_after.z, 0);
    assert_equal(test_state.state_after.v, 0);
});

add_test("op0.8 EXR N", function () {
    // EXR 10
    test_state.state.code[0] = 0b0000_1000_1010;
    test_state.state.mem[R0] = 0b1011;
    test_state.state.mem[R1] = 0b0110;
    test_state.state.mem[R2] = 0b1110;
    test_state.state.mem[R3] = 0b0101;
    test_state.state.mem[R4] = 0b0001;
    test_state.state.mem[R5] = 0b1100;
    test_state.state.mem[R6] = 0b0101;
    test_state.state.mem[R7] = 0b1011;
    test_state.state.mem[R8] = 0b0100;
    test_state.state.mem[R9] = 0b1000;
    test_state.state.mem[OUT] = 0b1111;
    test_state.state.mem[0xE0] = 0b1110;
    test_state.state.mem[0xE1] = 0b1001;
    test_state.state.mem[0xE2] = 0b0010;
    test_state.state.mem[0xE3] = 0b1110;
    test_state.state.mem[0xE4] = 0b1100;
    test_state.state.mem[0xE5] = 0b0000;
    test_state.state.mem[0xE6] = 0b1101;
    test_state.state.mem[0xE7] = 0b0111;
    test_state.state.mem[0xE8] = 0b1101;
    test_state.state.mem[0xE9] = 0b0011;
    test_state.state.mem[0xEA] = 0b0001;
    test_advance();
    test_advance(test_state.state_after.mem[R0], 0b1110);
    test_advance(test_state.state_after.mem[R1], 0b1001);
    test_advance(test_state.state_after.mem[R2], 0b0010);
    test_advance(test_state.state_after.mem[R3], 0b1110);
    test_advance(test_state.state_after.mem[R4], 0b1100);
    test_advance(test_state.state_after.mem[R5], 0b0000);
    test_advance(test_state.state_after.mem[R6], 0b1101);
    test_advance(test_state.state_after.mem[R7], 0b0111);
    test_advance(test_state.state_after.mem[R8], 0b1101);
    test_advance(test_state.state_after.mem[R9], 0b0011);
    test_advance(test_state.state_after.mem[OUT], 0b1111);
    test_advance(test_state.state_after.mem[0xE0], 0b1011);
    test_advance(test_state.state_after.mem[0xE1], 0b0110);
    test_advance(test_state.state_after.mem[0xE2], 0b1110);
    test_advance(test_state.state_after.mem[0xE3], 0b0101);
    test_advance(test_state.state_after.mem[0xE4], 0b0001);
    test_advance(test_state.state_after.mem[0xE5], 0b1100);
    test_advance(test_state.state_after.mem[0xE6], 0b0101);
    test_advance(test_state.state_after.mem[0xE7], 0b1011);
    test_advance(test_state.state_after.mem[0xE8], 0b0100);
    test_advance(test_state.state_after.mem[0xE9], 0b1000);
    test_advance(test_state.state_after.mem[0xEA], 0b0001);
});

add_test("op0.9 BIT RG,M", function () {
    // BIT R2,3
    test_state.state.code[0] = 0b0000_1001_1011;
    test_state.state.mem[R2] = 0b1101;
    test_state.state.c = 0;
    test_state.state.z = 1;
    test_state.state.v = 0;
    test_advance();
    assert_equal(test_state.state_after.mem[R2], 0b1101);
    assert_equal(test_state.state_after.c, 0);
    assert_equal(test_state.state_after.z, 0);
    assert_equal(test_state.state_after.v, 0);
});

add_test("op0.9 BIT RG,M", function () {
    // BIT R3,0
    test_state.state.code[0] = 0b0000_1001_1100;
    test_state.state.mem[0x0B] = 0b1100;
    test_state.state.mem[0xF3] = 0b1000; // WRFLAGS
    test_state.state.mem[0xFB] = 0b1011;
    test_state.state.c = 0;
    test_state.state.z = 0;
    test_state.state.v = 1;
    test_advance();
    assert_equal(test_state.state_after.mem[0x0B], 0b1100);
    assert_equal(test_state.state_after.mem[0xFB], 0b1011);
    assert_equal(test_state.state_after.c, 0);
    assert_equal(test_state.state_after.z, 1);
    assert_equal(test_state.state_after.v, 1);
});

add_test("op0.10 BSET RG,M", function () {
    // BSET R1,2
    test_state.state.code[0] = 0b0000_1010_0110;
    test_state.state.mem[R1] = 0b1000;
    test_state.state.c = 0;
    test_state.state.z = 1;
    test_state.state.v = 0;
    test_advance();
    assert_equal(test_state.state_after.mem[R1], 0b1100);
    assert_equal(test_state.state_after.c, 0);
    assert_equal(test_state.state_after.z, 1);
    assert_equal(test_state.state_after.v, 0);
});

add_test("op0.10 BSET RG,M", function () {
    // BSET R3,3
    test_state.state.code[0] = 0b0000_1010_1111;
    test_state.state.mem[0x0A] = 0b0000;
    test_state.state.mem[0xF3] = 0b1011; // WRFLAGS
    test_state.state.mem[0xFA] = 0b1000;
    test_state.state.c = 0;
    test_state.state.z = 1;
    test_state.state.v = 0;
    test_advance();
    assert_equal(test_state.state_after.mem[0xFA], 0b1000);
    assert_equal(test_state.state_after.c, 0);
    assert_equal(test_state.state_after.z, 1);
    assert_equal(test_state.state_after.v, 0);
});

add_test("op0.11 BCLR RG,M", function () {
    // BCLR R0,1
    test_state.state.code[0] = 0b0000_1011_0001;
    test_state.state.mem[R0] = 0b1111;
    test_state.state.c = 0;
    test_state.state.z = 1;
    test_state.state.v = 0;
    test_advance();
    assert_equal(test_state.state_after.mem[R0], 0b1101);
    assert_equal(test_state.state_after.c, 0);
    assert_equal(test_state.state_after.z, 1);
    assert_equal(test_state.state_after.v, 0);
});

add_test("op0.11 BCLR RG,M", function () {
    // BCLR R3,1
    test_state.state.code[0] = 0b0000_1011_1101;
    test_state.state.mem[0x0A] = 0b1110;
    test_state.state.mem[0xF3] = 0b1101; // WRFLAGS
    test_state.state.mem[0xFA] = 0b1100;
    test_state.state.c = 1;
    test_state.state.z = 0;
    test_state.state.v = 1;
    test_advance();
    assert_equal(test_state.state_after.mem[0xFA], 0b1100);
    assert_equal(test_state.state_after.c, 1);
    assert_equal(test_state.state_after.z, 0);
    assert_equal(test_state.state_after.v, 1);
});

add_test("op0.12 BTG RG,M", function () {
    // BTG R2,0
    test_state.state.code[0] = 0b0000_1100_1000;
    test_state.state.mem[R2] = 0b0101;
    test_state.state.c = 0;
    test_state.state.z = 1;
    test_state.state.v = 0;
    test_advance();
    assert_equal(test_state.state_after.mem[R2], 0b0100);
    assert_equal(test_state.state_after.c, 0);
    assert_equal(test_state.state_after.z, 1);
    assert_equal(test_state.state_after.v, 0);
});

add_test("op0.12 BTG RG,M", function () {
    // BCLR R3,3
    test_state.state.code[0] = 0b0000_1100_1111;
    test_state.state.mem[0x0A] = 0b1111;
    test_state.state.mem[0xF3] = 0b0101; // WRFLAGS
    test_state.state.mem[0xFA] = 0b0111;
    test_state.state.c = 1;
    test_state.state.z = 1;
    test_state.state.v = 0;
    test_advance();
    assert_equal(test_state.state_after.mem[0x0A], 0b0111);
    assert_equal(test_state.state_after.c, 1);
    assert_equal(test_state.state_after.z, 1);
    assert_equal(test_state.state_after.v, 0);
});

add_test("op0.13 RRC RY", function () {
    // RRC R4
    test_state.state.code[0] = 0b0000_1101_0100;
    test_state.state.mem[R4] = 0b0100;
    test_state.state.c = 1;
    test_state.state.z = 0;
    test_state.state.v = 0;
    test_advance();
    assert_equal(test_state.state_after.mem[R4], 0b1010);
    assert_equal(test_state.state_after.c, 0);
    assert_equal(test_state.state_after.z, 0);
    assert_equal(test_state.state_after.v, 0);
});

add_test("op0.14 RET R0,N", function () {
    // RET R0,4
    var pc = 0b0010_0101_1100;
    test_state.state.pc = pc;
    test_state.state.code[pc] = 0b0000_1110_0100;
    test_state.state.mem[R0] = 0b1010;
    test_state.state.sp = 0b010;
    test_state.state.mem[0x10] = 0b1111;
    test_state.state.mem[0x11] = 0b0000;
    test_state.state.mem[0x12] = 0b0000;
    test_state.state.mem[0x13] = 0b1011;
    test_state.state.mem[0x14] = 0b1100;
    test_state.state.mem[0x15] = 0b0001;
    test_state.state.c = 0;
    test_state.state.z = 0;
    test_state.state.v = 0;
    test_advance();
    assert_equal(test_state.state_after.mem[R0], 0b0100);
    assert_equal(test_state.state_after.sp, 0b001);
    assert_equal(test_state.state_after.pc, 0b0001_1100_1011);
    assert_equal(test_state.state_after.c, 0);
    assert_equal(test_state.state_after.z, 0);
    assert_equal(test_state.state_after.v, 0);
});

add_test("op0.15 SKIP F,M", function () {
    // SKIP nc,#2
    var pc = 0b0000_1000_1101;
    test_state.state.pc = pc;
    test_state.state.code[pc] = 0b0000_1111_0110;
    test_state.state.c = 0;
    test_state.state.z = 1;
    test_state.state.v = 0;
    test_advance();
    assert_equal(test_state.state_after.pc, 0b0000_1001_0000);
    assert_equal(test_state.state_after.c, 0);
    assert_equal(test_state.state_after.z, 1);
    assert_equal(test_state.state_after.v, 0);
});

add_test("op8 MOV RX,RY", function () {
    // long jump
    // MOV PCL,R4
    var pc = 0b0101_0110_0011;
    test_state.state.pc = pc;
    test_state.state.code[pc] = 0b1000_1101_0100;
    test_state.state.mem[R4] = 0b1001;
    test_state.state.mem[PCH] = 0b0001;
    test_state.state.mem[PCM] = 0b0010;
    test_state.state.mem[PCL] = 0b0100;
    test_state.state.mem[JSR] = 0b1111;
    // something already on stack below and above
    test_state.state.sp = 1;
    test_state.state.mem[0x10] = 0b1100;
    test_state.state.mem[0x11] = 0b1010;
    test_state.state.mem[0x12] = 0b0011;
    test_state.state.mem[0x13] = 0b0001;
    test_state.state.mem[0x14] = 0b0010;
    test_state.state.mem[0x15] = 0b0100;
    test_state.state.c = 1;
    test_state.state.z = 1;
    test_state.state.v = 1;
    test_advance();
    assert_equal(test_state.state_after.pc, 0b0001_0010_1001);
    assert_equal(test_state.state_after.mem[JSR], 0b1111);
    assert_equal(test_state.state_after.mem[PCL], 0b1001);
    // existing stack values don't change
    assert_equal(test_state.state_after.sp, 1);
    assert_equal(test_state.state_after.mem[0x10], 0b1100);
    assert_equal(test_state.state_after.mem[0x11], 0b1010);
    assert_equal(test_state.state_after.mem[0x12], 0b0011);
    assert_equal(test_state.state_after.mem[0x13], 0b0001);
    assert_equal(test_state.state_after.mem[0x14], 0b0010);
    assert_equal(test_state.state_after.mem[0x15], 0b0100);
    assert_equal(test_state.state_after.c, 1);
    assert_equal(test_state.state_after.z, 1);
    assert_equal(test_state.state_after.v, 1);
});

add_test("op8 MOV RX,RY", function () {
    // CALL
    // MOV JSR,R4
    var pc = 0b0101_0110_0011;
    test_state.state.pc = pc;
    test_state.state.code[pc] = 0b1000_1100_0100;
    test_state.state.mem[R4] = 0b1001;
    test_state.state.mem[PCH] = 0b0001;
    test_state.state.mem[PCM] = 0b0010;
    test_state.state.mem[PCL] = 0b0100;
    test_state.state.mem[JSR] = 0b1111;
    // something already on stack below and above
    test_state.state.sp = 1;
    test_state.state.mem[0x10] = 0b1100;
    test_state.state.mem[0x11] = 0b1010;
    test_state.state.mem[0x12] = 0b0011;
    test_state.state.mem[0x13] = 0b0001;
    test_state.state.mem[0x14] = 0b0010;
    test_state.state.mem[0x15] = 0b0100;
    test_state.state.c = 1;
    test_state.state.z = 1;
    test_state.state.v = 1;
    test_advance();
    assert_equal(test_state.state_after.pc, 0b0001_0010_1001);
    assert_equal(test_state.state_after.mem[JSR], 0b1001);
    assert_equal(test_state.state_after.mem[PCL], 0b0100);
    // existing stack values don't change
    assert_equal(test_state.state_after.sp, 2);
    assert_equal(test_state.state_after.mem[0x10], 0b1100);
    assert_equal(test_state.state_after.mem[0x11], 0b1010);
    assert_equal(test_state.state_after.mem[0x12], 0b0011);
    // the next instruction after where we called from
    assert_equal(test_state.state_after.mem[0x13], 0b0100);
    assert_equal(test_state.state_after.mem[0x14], 0b0110);
    assert_equal(test_state.state_after.mem[0x15], 0b0101);
    assert_equal(test_state.state_after.c, 1);
    assert_equal(test_state.state_after.z, 1);
    assert_equal(test_state.state_after.v, 1);
});

add_test("op9 MOV RX,#N", function () {
    // long jump
    // MOV PCL,#9
    var pc = 0b0101_0110_0011;
    test_state.state.pc = pc;
    test_state.state.code[pc] = 0b1001_1101_1001;
    test_state.state.mem[PCH] = 0b0001;
    test_state.state.mem[PCM] = 0b0010;
    test_state.state.mem[PCL] = 0b0100;
    test_state.state.mem[JSR] = 0b1111;
    // something already on stack below and above
    test_state.state.sp = 1;
    test_state.state.mem[0x10] = 0b1100;
    test_state.state.mem[0x11] = 0b1010;
    test_state.state.mem[0x12] = 0b0011;
    test_state.state.mem[0x13] = 0b0001;
    test_state.state.mem[0x14] = 0b0010;
    test_state.state.mem[0x15] = 0b0100;
    test_state.state.c = 1;
    test_state.state.z = 1;
    test_state.state.v = 1;
    test_advance();
    assert_equal(test_state.state_after.pc, 0b0001_0010_1001);
    assert_equal(test_state.state_after.mem[JSR], 0b1111);
    assert_equal(test_state.state_after.mem[PCL], 0b1001);
    // existing stack values don't change
    assert_equal(test_state.state_after.sp, 1);
    assert_equal(test_state.state_after.mem[0x10], 0b1100);
    assert_equal(test_state.state_after.mem[0x11], 0b1010);
    assert_equal(test_state.state_after.mem[0x12], 0b0011);
    assert_equal(test_state.state_after.mem[0x13], 0b0001);
    assert_equal(test_state.state_after.mem[0x14], 0b0010);
    assert_equal(test_state.state_after.mem[0x15], 0b0100);
    assert_equal(test_state.state_after.c, 1);
    assert_equal(test_state.state_after.z, 1);
    assert_equal(test_state.state_after.v, 1);
});

add_test("op9 MOV RX,#N", function () {
    // CALL
    // MOV JSR,#9
    var pc = 0b0101_0110_0011;
    test_state.state.pc = pc;
    test_state.state.code[pc] = 0b1001_1100_1001;
    test_state.state.mem[PCH] = 0b0001;
    test_state.state.mem[PCM] = 0b0010;
    test_state.state.mem[PCL] = 0b0100;
    test_state.state.mem[JSR] = 0b1111;
    // something already on stack below and above
    test_state.state.sp = 1;
    test_state.state.mem[0x10] = 0b1100;
    test_state.state.mem[0x11] = 0b1010;
    test_state.state.mem[0x12] = 0b0011;
    test_state.state.mem[0x13] = 0b0001;
    test_state.state.mem[0x14] = 0b0010;
    test_state.state.mem[0x15] = 0b0100;
    test_state.state.c = 1;
    test_state.state.z = 1;
    test_state.state.v = 1;
    test_advance();
    assert_equal(test_state.state_after.pc, 0b0001_0010_1001);
    assert_equal(test_state.state_after.mem[JSR], 0b1001);
    assert_equal(test_state.state_after.mem[PCL], 0b0100);
    // existing stack values don't change
    assert_equal(test_state.state_after.sp, 2);
    assert_equal(test_state.state_after.mem[0x10], 0b1100);
    assert_equal(test_state.state_after.mem[0x11], 0b1010);
    assert_equal(test_state.state_after.mem[0x12], 0b0011);
    // the next instruction after where we called from
    assert_equal(test_state.state_after.mem[0x13], 0b0100);
    assert_equal(test_state.state_after.mem[0x14], 0b0110);
    assert_equal(test_state.state_after.mem[0x15], 0b0101);
    assert_equal(test_state.state_after.c, 1);
    assert_equal(test_state.state_after.z, 1);
    assert_equal(test_state.state_after.v, 1);
});


add_test("format_number", function () {
    assert_equal(format_number(15), "2_1111");
    assert_equal(format_number(0), "2_0000");
    assert_equal(format_number(255), "0xFF");
});

add_test("parse_number", function () {
    function test(str, expected_num) {
        assert_equal(parse_number(str), expected_num, str);
    }
    // binary
    test("0B1111", 15);
    test("0B11111111", 255);
    test("0B0000", 0);
    test("0B00000000", 0);
    test("0B0", 0);
    test("0b1111", 15);
    test("0b0000", 0);
    test("0b0", 0);
    test("2_1111", 15);
    test("2_0000", 0);
    test("2_0", 0);

    // hex
    test("0xF", 15);
    test("0xf", 15);
    test("0xFF", 255);
    test("0xff", 255);
    test("0x0", 0);
    test("0x00", 0);
    test("0XF", 15);
    test("0X0", 0);
    test("16_F", 15);
    test("16_0", 0);

    // decimal
    test("10_15", 15);
    test("10_255", 255);
    test("10_0", 0);
    test("10_09", 9);
    test("10_009", 9);
    test("15", 15);
    test("0", 0);
    test("09", 9);
});

var consoletext_element = document.getElementById("consoletext");
consoletext_element.value = "";
function print(s) {
    consoletext_element.value += s;
}
// run all tests:
for (const test of all_tests) {
    test_setup();
    test.func();
    if (test_state.test_pass) {
        print('.');
    } else {
        print('X');
    }
}