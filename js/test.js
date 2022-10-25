var test_state = null;
var all_tests = [];

function test_setup() {
    test_state = {
        state: new_state(),
        state_after: null,
        test_pass: true
    };
}

function assert_equal(a, b, msg) {
    if (a === b) {

    } else {
        console.trace(a, b, msg);
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
    test_state.state.regs[R0] = 0b1011;
    test_state.state.regs[R2] = 0b0111;
    test_advance();
    assert_equal(test_state.state_after.regs[R2], 0b0010);
    assert_equal(test_state.state_after.c, 1);
    assert_equal(test_state.state_after.z, 0);
    assert_equal(test_state.state_after.v, 0);
});

add_test("op1 ADD R2,R0", function () {
    // ADD RX,RY
    test_state.state.code[0] = 0b0001_0010_0000;
    test_state.state.regs[R0] = 0b0001;
    test_state.state.regs[R2] = 0b1111;
    test_advance();
    assert_equal(test_state.state_after.regs[R2], 0b0000);
    assert_equal(test_state.state_after.c, 1);
    assert_equal(test_state.state_after.z, 1);
    assert_equal(test_state.state_after.v, 0);
});

add_test("op1 ADD R2,R0", function () {
    // ADD RX,RY
    test_state.state.code[0] = 0b0001_0010_0000;
    test_state.state.regs[R0] = 0b1001;
    test_state.state.regs[R2] = 0b1110;
    test_advance();
    assert_equal(test_state.state_after.regs[R2], 0b0111);
    assert_equal(test_state.state_after.c, 1);
    assert_equal(test_state.state_after.z, 0);
    assert_equal(test_state.state_after.v, 1);
});

add_test("op2 ADC", function () {
    // ADC R1,R7
    test_state.state.code[0] = 0b0010_0001_0111;
    test_state.state.regs[R1] = 0b0100;
    test_state.state.regs[R7] = 0b1011;
    test_state.state.c = 1;
    test_advance();
    assert_equal(test_state.state_after.regs[R1], 0b0000);
    assert_equal(test_state.state_after.c, 1);
    assert_equal(test_state.state_after.z, 1);
    assert_equal(test_state.state_after.v, 0);
});

add_test("op3 SUB ex1", function () {
    // SUB R6,R2
    test_state.state.code[0] = 0b0011_0110_0010;
    test_state.state.regs[R2] = 0b1001;
    test_state.state.regs[R6] = 0b1111;
    test_advance();
    assert_equal(test_state.state_after.regs[R6], 0b0110);
    assert_equal(test_state.state_after.c, 1);
    assert_equal(test_state.state_after.z, 0);
    assert_equal(test_state.state_after.v, 0);
});

add_test("op3 SUB ex2", function () {
    // SUB R10,R4
    test_state.state.code[0] = 0b0011_1010_0100;
    test_state.state.regs[R4] = 0b0111;
    test_state.state.regs[OUT] = 0b0101;
    test_advance();
    assert_equal(test_state.state_after.regs[OUT], 0b1110);
    assert_equal(test_state.state_after.c, 0);
    assert_equal(test_state.state_after.z, 0);
    assert_equal(test_state.state_after.v, 0);
});

add_test("op3 SBB", function () {
    // SBB R5,R3
    test_state.state.code[0] = 0b0100_0101_0011;
    test_state.state.regs[R5] = 0b1110;
    test_state.state.regs[R3] = 0b0011;
    test_state.state.c = 0;
    test_advance();
    assert_equal(test_state.state_after.regs[R5], 0b1010);
    assert_equal(test_state.state_after.c, 1);
    assert_equal(test_state.state_after.z, 0);
    assert_equal(test_state.state_after.v, 0);
});

add_test("op4 SBB", function () {
    // SBB R6,R7
    test_state.state.code[0] = 0b0100_0110_0111;
    test_state.state.regs[R6] = 0b0110;
    test_state.state.regs[R7] = 0b1110;
    test_state.state.c = 1;
    test_advance();
    assert_equal(test_state.state_after.regs[R6], 0b1000);
    assert_equal(test_state.state_after.c, 0);
    assert_equal(test_state.state_after.z, 0);
    assert_equal(test_state.state_after.v, 1);
});

add_test("op5 OR", function () {
    // OR R0,R7
    test_state.state.code[0] = 0b0101_0000_0111;
    test_state.state.regs[R0] = 0b0101;
    test_state.state.regs[R7] = 0b1101;
    test_state.state.c = 0;
    test_state.state.z = 1;
    test_state.state.v = 0;
    test_advance();
    assert_equal(test_state.state_after.regs[R0], 0b1101);
    assert_equal(test_state.state_after.c, 0);
    assert_equal(test_state.state_after.z, 0);
    assert_equal(test_state.state_after.v, 0);
});

add_test("op6 AND", function () {
    // AND R13,R12
    test_state.state.code[0] = 0b0110_1010_1011;
    test_state.state.regs[OUT] = 0b0111;
    test_state.state.regs[IN] = 0b1110;
    test_state.state.c = 0;
    test_state.state.z = 1;
    test_state.state.v = 0;
    test_advance();
    assert_equal(test_state.state_after.regs[OUT], 0b0110);
    assert_equal(test_state.state_after.c, 0);
    assert_equal(test_state.state_after.z, 0);
    assert_equal(test_state.state_after.v, 0);
});

add_test("op7 XOR", function () {
    // XOR R8,R3
    test_state.state.code[0] = 0b0111_1000_0011;
    test_state.state.regs[R8] = 0b0110;
    test_state.state.regs[R3] = 0b1100;
    test_state.state.c = 0;
    test_state.state.z = 1;
    test_state.state.v = 0;
    test_advance();
    assert_equal(test_state.state_after.regs[R8], 0b1010);
    assert_equal(test_state.state_after.c, 0);
    assert_equal(test_state.state_after.z, 0);
    assert_equal(test_state.state_after.v, 0);
});

add_test("op8 MOV", function () {
    // MOV R6,R5
    test_state.state.code[0] = 0b1000_0110_0101;
    test_state.state.regs[R6] = 0b1110;
    test_state.state.regs[R5] = 0b0010;
    test_state.state.c = 0;
    test_state.state.z = 0;
    test_state.state.v = 0;
    test_advance();
    assert_equal(test_state.state_after.regs[R6], 0b0010);
    assert_equal(test_state.state_after.c, 0);
    assert_equal(test_state.state_after.z, 0);
    assert_equal(test_state.state_after.v, 0);
});

add_test("op9 MOV", function () {
    // MOV R9,7
    test_state.state.code[0] = 0b1001_1001_0111;
    test_state.state.regs[R9] = 0b1010;
    test_state.state.c = 0;
    test_state.state.z = 0;
    test_state.state.v = 0;
    test_advance();
    assert_equal(test_state.state_after.regs[R9], 0b0111);
    assert_equal(test_state.state_after.c, 0);
    assert_equal(test_state.state_after.z, 0);
    assert_equal(test_state.state_after.v, 0);
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