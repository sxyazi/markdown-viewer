package main

var store = struct {
	workingPath string
}{
	workingPath: getArgument(),
}
