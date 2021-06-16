package main

import (
	"fmt"
	"github.com/PuerkitoBio/goquery"
	"io/ioutil"
	"net/http"
	"os"
	"path"
)

func home(w http.ResponseWriter, req *http.Request) {
	fmt.Fprint(w, newTemplate())
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

	fmt.Fprint(w, jsonEncode(resp))
}

func file(w http.ResponseWriter, req *http.Request) {
	p := req.FormValue("path")
	data, err := ioutil.ReadFile(p)
	if err != nil {
		return
	}

	output, err := markdownRender(data)
	if err != nil {
		return
	}

	doc, err := goquery.NewDocumentFromReader(output)
	doc.Find("img").Each(func(i int, selection *goquery.Selection) {
		src, _ := selection.Attr("src")
		selection.SetAttr("src", forwardResource(path.Dir(p), src))
	})

	html, _ := doc.Html()
	fmt.Fprint(w, html)
}

func files(w http.ResponseWriter, req *http.Request) {
	fmt.Fprint(w, jsonEncode(getFiles(store.workingPath)))
}

func forward(w http.ResponseWriter, req *http.Request) {
	p := req.URL.Query().Get("path")

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
