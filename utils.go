package main

import (
	"encoding/json"
	"io/fs"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"strings"
)

func getFiles(root string) (files Files) {
	files.Root = root

	filepath.Walk(root, func(path string, info fs.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if !strings.HasSuffix(strings.ToLower(info.Name()), ".md") {
			return nil
		}

		if isIgnored(path) {
			return nil
		}

		files.List = append(files.List, &File{
			Name:      info.Name(),
			Path:      path,
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
		panic("Please pass at least one parameter")
	}

	return os.Args[1]
}

func isIgnored(path string) bool {
	path = strings.ReplaceAll(path, "\\", "/")

	if strings.Contains(path, "/node_modules/") {
		return true
	}

	if strings.Contains(path, "/vendor/") && fileExistsDeep(path, "vendor", "autoload.php") {
		return true
	}

	return false
}

func wrapSlash(path string) string {
	return "/" + strings.Trim(path, "/") + "/"
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
	directory = wrapSlash(directory)
	parts := strings.Split(wrapSlash(root), directory)

	lastIndex := len(parts) - 1
	if strings.Contains(wrapSlash(parts[lastIndex]), directory) {
		parts[lastIndex] = ""
	} else {
		parts = parts[:lastIndex]
	}

	lead := ""
	for _, part := range parts {
		lead += part + directory
		lead = strings.ReplaceAll(lead, "//", "/")

		if _, err := os.Stat(lead + filename); err == nil {
			return true
		}
	}

	return false
}

func isExternalLink(link string) bool {
	r, _ := regexp.Compile("^(https?:)?//")
	return r.MatchString(link)
}

func forwardResource(parent, src string) string {
	if isExternalLink(src) {
		return src
	}

	return "/forward?path=" + url.QueryEscape(path.Join(parent, src))
}
