package main

import (
	"io/ioutil"
	"os"
)

var TEMPLATE = ""

func newTemplate() string {
	if _, err := os.Stat("template.html"); err == nil {
		code, _ := ioutil.ReadFile("template.html")
		return string(code)
	}

	return TEMPLATE
}
