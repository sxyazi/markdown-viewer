package main

import (
	"io/ioutil"
	"os"
)

func newTemplate() string {
	if _, err := os.Stat(store.workingPath + "/_template.html"); err == nil {
		code, _ := ioutil.ReadFile(store.workingPath + "/_template.html")
		return string(code)
	}

	indexBytes, _ := Asset("ui/dist/index.html")
	builtBytes, _ := Asset("ui/dist/built.js")
	return string(indexBytes) + "<script>" + string(builtBytes) + "</script>"
}
