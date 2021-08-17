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

function debounce(call, timeout) {
    let timer
    return () => {
        clearTimeout(timer)
        timer = setTimeout(call.bind(this), timeout)
    }
}

function scrollTo($e, top, time = 100) {
    Store.scrolling = true
    $e.animate({scrollTop: top}, time, () => setTimeout(() => Store.scrolling = false, 500))
}

function apiEndpoint(url) {
    if (location.port === '3000') {
        return `/${url}`
    }

    return `http://127.0.0.1:3000/${url}`
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
    debounce,
    scrollTo,
    apiEndpoint,
    respondToVisible,
    cancelToRespond,
    selectionText,
    copyElementText
}
