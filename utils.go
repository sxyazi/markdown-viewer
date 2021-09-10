package main

import (
	"bytes"
	"encoding/json"
	"github.com/PuerkitoBio/goquery"
	"io/fs"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
)

func getFiles(root string) (files Files) {
	files.Root = path.Clean(root)
	rootPathLength := len(files.Root)

	filepath.Walk(files.Root, func(p string, info fs.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if !strings.HasSuffix(strings.ToLower(info.Name()), ".md") {
			return nil
		}

		if isIgnored(p) {
			return nil
		}

		files.List = append(files.List, &File{
			Name:      markdownName(p),
			Path:      path.Clean("/" + p[rootPathLength:]),
			Size:      info.Size(),
			Exists:    true,
			UpdatedAt: info.ModTime().UnixNano(),
		})

		return nil
	})

	return
}

func getArgument() string {
	if len(os.Args) < 2 {
		panic("Please pass at least one parameters")
	}

	arg := bothSlash(os.Args[1])
	if _, e := os.Stat(arg); e != nil {
		panic("The working path does not exist")
	}

	return arg
}

func purify(html []byte) []byte {
	doc, e := goquery.NewDocumentFromReader(bytes.NewReader(html))
	if e != nil {
		return html
	}

	text := strings.Trim(doc.Text(), " ")
	for strings.Contains(text, "  ") {
		text = strings.ReplaceAll(text, "  ", " ")
	}

	return []byte(text)
}

func distinct(id []byte, records map[string]int) []byte {
	_id := string(id)
	if times, ok := records[_id]; ok {
		records[_id] = times + 1
		return []byte(_id + "-" + strconv.Itoa(records[_id]))
	}

	records[_id] = 1
	return id
}

func isIgnored(p string) bool {
	p = path.Clean(p)

	if strings.Contains(p, "/node_modules/") {
		return true
	}

	if strings.Contains(p, "/vendor/") && fileExistsDeep(p, "vendor", "autoload.php") {
		return true
	}

	return false
}

func leftSlash(p string) string {
	return path.Clean("/" + p)
}

func bothSlash(p string) string {
	return path.Clean("/" + p + "/")
}

func jsonEncode(value interface{}) string {
	result, err := json.Marshal(value)
	if err != nil {
		return ""
	}

	return string(result)
}

func contentType(filename string) string {
	switch path.Ext(strings.ToLower(filename)) {
	case ".jpg":
		fallthrough
	case ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".gif":
		return "image/gif"
	case ".svg":
		return "image/svg+xml"
	}

	return "application/octet-stream"
}

func fileExistsDeep(root string, directory string, filename string) bool {
	directory = bothSlash(directory)
	parts := strings.Split(bothSlash(root), directory)

	lastIndex := len(parts) - 1
	if strings.Contains(bothSlash(parts[lastIndex]), directory) {
		parts[lastIndex] = ""
	} else {
		parts = parts[:lastIndex]
	}

	lead := ""
	for _, part := range parts {
		lead += part + directory
		lead = path.Clean(lead)

		if _, err := os.Stat(lead + filename); err == nil {
			return true
		}
	}

	return false
}

func markdownName(p string) string {
	return path.Base(p)
}

func isExternalLink(link string) bool {
	r, _ := regexp.Compile("^(https?:)?//")
	return r.MatchString(link)
}

func forwardResource(relative, src string) string {
	if isExternalLink(src) {
		return src
	}

	if !strings.HasPrefix(src, "/") {
		src = path.Join(relative, src)[len(store.workingPath):]
	}

	return "/forward?path=" + url.QueryEscape(leftSlash(src))
}
