package main

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"path"
)

func home(w http.ResponseWriter, req *http.Request) {
	fmt.Fprint(w, newTemplate())
}

func stat(w http.ResponseWriter, req *http.Request) {
	p := leftSlash(req.FormValue("path"))
	info, err := os.Stat(store.workingPath + p)

	var resp *File
	if err != nil {
		resp = &File{
			Name: path.Base(p),
			Path: p,
		}
	} else {
		resp = &File{
			Name:      path.Base(info.Name()),
			Path:      p,
			Size:      info.Size(),
			Exists:    true,
			UpdatedAt: info.ModTime().UnixNano(),
		}
	}

	fmt.Fprint(w, jsonEncode(resp))
}

func file(w http.ResponseWriter, req *http.Request) {
	html, err := markdown(path.Clean(store.workingPath + "/" + req.FormValue("path")))
	if err != nil {
		return
	}

	fmt.Fprint(w, html)
}

func files(w http.ResponseWriter, req *http.Request) {
	fmt.Fprint(w, jsonEncode(getFiles(store.workingPath)))
}

func forward(w http.ResponseWriter, req *http.Request) {
	p := store.workingPath + req.URL.Query().Get("path")

	if _, err := os.Stat(p); err != nil {
		w.WriteHeader(http.StatusNotFound)
		return
	}

	if data, err := ioutil.ReadFile(p); err == nil {
		w.Header().Set("Content-Type", contentType(p))
		w.Write(data)
		return
	}

	w.WriteHeader(http.StatusInternalServerError)
}

func main() {
	http.HandleFunc("/", home)
	http.HandleFunc("/stat", stat)
	http.HandleFunc("/file", file)
	http.HandleFunc("/files", files)
	http.HandleFunc("/forward", forward)

	http.ListenAndServe(":3000", nil)
}
