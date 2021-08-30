import $ from 'jquery'
import Store from '@/store'

let callback
const observer = new IntersectionObserver(function (entries, observer) {
    entries.forEach((entry) => {
        if (entry.intersectionRatio > 0)
            setTimeout(() => isInViewport(entry.target) && callback(entry.target), 50)
    })
}, {
    root: document.documentElement
})

function clone(obj) {
    return JSON.parse(JSON.stringify(obj))
}

function prism() {
    const Prism = require('prismjs')
    require('prismjs/components/prism-js-templates.min')
    require('prismjs/components/prism-markup-templating.min')
    require('prismjs/components/prism-c.min')
    require('prismjs/components/prism-cpp.min')
    require('prismjs/components/prism-php.min')

    require('prismjs/components/prism-go.min')
    require('prismjs/components/prism-java.min')
    require('prismjs/components/prism-swift.min')
    require('prismjs/components/prism-python.min')
    require('prismjs/components/prism-javascript.min')
    require('prismjs/components/prism-typescript.min')

    require('prismjs/components/prism-css.min')
    require('prismjs/components/prism-http.min')
    require('prismjs/components/prism-bash.min')
    return Prism
}

function debounce(call, timeout) {
    let timer
    return () => {
        clearTimeout(timer)
        timer = setTimeout(call.bind(this), timeout)
    }
}

function scrollTo($e, top, time = 50) {
    Store.scrolling = true
    $e.clearQueue().stop()
    $e.animate({scrollTop: top}, time, () => setTimeout(() => Store.scrolling = false, 500))
}

function apiEndpoint(url) {
    if (location.port === '3000') {
        return `/${url}`
    }

    return `http://127.0.0.1:3000/${url}`
}

function groupFiles(files) {
    const paths = {}
    const groups = {}
    for (let file of files.list)
        paths[file.path] = file

    let i = 0
    while (i < files.list.length) {
        const file = files.list[i++]

        // Contains at least one slash in addition to the first slash
        const index = file.path.substr(1).indexOf('/')
        if (index === -1) continue

        // The README.md file must exist in this directory
        const dir = file.path.substr(0, index + 1)
        if (!(`${dir}/README.md` in paths)) continue

        if (dir in groups) {
            files.list.splice(--i, 1)
        } else {
            groups[dir] = []
            paths[file.path].children = groups[dir]
            paths[file.path].name = paths[file.path].name === 'README.md' ? `${dir.substr(1)}/` : paths[file.path].name
            files.list.splice(i - 1, 1, paths[file.path])
        }

        if (file.path !== `${dir}/README.md`)
            groups[dir].push(file)
    }

    return files
}

function respondToVisible(element, call) {
    callback = call
    observer.observe(element)
}

function cancelToRespond(element) {
    observer.unobserve(element)
}

function isInViewport(element) {
    const $element = $(element)
    const elementTop = $element.offset().top
    const elementBottom = elementTop + $element.outerHeight()

    const viewportTop = $(window).scrollTop()
    const viewportBottom = viewportTop + $(window).height()
    return elementBottom > viewportTop && elementTop < viewportBottom
}

function selectionText() {
    let text = ''
    if (window.getSelection) {
        text = window.getSelection().toString()
    } else if (document.selection && document.selection.type !== 'Control') {
        text = document.selection.createRange().text
    }
    return text
}

function copyElementText(element) {
    let range, selection
    if (document.body.createTextRange) {
        range = document.body.createTextRange()
        range.moveToElementText(element)
        range.select()
    } else if (window.getSelection) {
        selection = window.getSelection()
        range = document.createRange()
        range.selectNodeContents(element)
        selection.removeAllRanges()
        selection.addRange(range)
    }

    try {
        document.execCommand('copy', false, null)
    } catch {
        return false
    }

    return true
}

export {
    clone,
    prism,
    debounce,
    scrollTo,
    apiEndpoint,
    groupFiles,
    respondToVisible,
    cancelToRespond,
    selectionText,
    copyElementText
}
