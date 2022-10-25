var test_state = null;
var all_tests = [];

function test_setup() {
    test_state = {
        state : new_state(),
        state_after : null,
        test_pass : true
    };
}

function assert_equal(a,b,msg) {
    if (a === b) {

    } else {
        debugger;
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

add_test("NOP", function(){
    // MOV R0 R0
    test_state.state.pc = 0x123;
    test_state.state.code[0x123] = 0b100_0000_0000;

    test_advance();

    // verify instruction pointer advanced
    assert_equal(test_state.state_after.pc,0x124);
    // verify flags still clear
    assert_equal(test_state.state_after.c,0);
    assert_equal(test_state.state_after.z,0);
    assert_equal(test_state.state_after.v,0);
});

add_test("NOP", function(){
    // MOV R0 R0
    test_state.state.code[0] = 0b100_0000_0000;
    // set flags
    test_state.state.c = 1;
    test_state.state.z = 1;
    test_state.state.v = 1;
    
    test_advance();
    
    // verify flags still set
    assert_equal(test_state.state_after.c,1);
    assert_equal(test_state.state_after.z,1);
    assert_equal(test_state.state_after.v,1);
});

add_test("NOP", function(){
     // MOV R0 R0
     test_state.state.pc = 0xFFF;
     test_state.state.code[0xFFF] = 0b100_0000_0000;
 
     test_advance();
 
     // verify instruction pointer advanced, wrapping around
     assert_equal(test_state.state_after.pc,0x000);
});

// add_test("op1 ADD R2,R0", function(){
//     // ADD RX,RY
//     test_state.state.code[0] = 0b0001_0010_0000;
//     test_state.state.regs[R0] = 0b1011;
//     test_state.state.regs[R2] = 0b0111;
//     test_advance();
//     assert_equal(test_state.state_after.regs[R2],0b0010);
//     assert_equal(test_state.state_after.c,1);
//     assert_equal(test_state.state_after.z,0);
//     assert_equal(test_state.state_after.v,0);
// });

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