package main

import (
	"fmt"
	"github.com/Depado/bfchroma"
	"github.com/russross/blackfriday/v2"
	"io/ioutil"
	"net/http"
	"os"
	"path"
)

func home(w http.ResponseWriter, req *http.Request) {
	fmt.Fprintf(w, newTemplate())
}

func stat(w http.ResponseWriter, req *http.Request) {
	p := req.FormValue("path")
	info, err := os.Stat(p)

	var resp *File
	if err != nil {
		resp = &File{
			Name: path.Base(p),
			Path: p,
		}
	} else {
		resp = &File{
			Name:      path.Base(info.Name()),
			Path:      info.Name(),
			Size:      info.Size(),
			Exists:    true,
			UpdatedAt: info.ModTime().UnixNano(),
		}
	}

	fmt.Fprintf(w, jsonEncode(resp))
}

func file(w http.ResponseWriter, req *http.Request) {
	data, err := ioutil.ReadFile(req.FormValue("path"))
	if err != nil {
		return
	}

	output := blackfriday.Run(
		data,
		blackfriday.WithRenderer(bfchroma.NewRenderer(bfchroma.Style("github"))),
	)

	w.Write(output)
}

func files(w http.ResponseWriter, req *http.Request) {
	fmt.Fprintf(w, jsonEncode(getFiles(store.workingPath)))
}

func main() {
	http.HandleFunc("/", home)
	http.HandleFunc("/stat", stat)
	http.HandleFunc("/file", file)
	http.HandleFunc("/files", files)

	http.ListenAndServe(":3000", nil)
}
