import $ from 'jquery'
import Katex from 'katex'
import Store from '@/store'
import {
    apiEndpoint,
    cancelToRespond,
    copyElementText,
    debounce,
    prism,
    respondToVisible,
    scrollTo,
    selectionText,
    syncLocation
} from '@/utils'

const adjustHeading = debounce(() => {
    if (!Store.scrolling || !Store.currentHeading.length)
        return

    if (atBottom())
        Store.currentHeading.find('.heading-anchor').click()
}, 50)

function atBottom($currentHeading = Store.currentHeading) {
    const contentElem = $('#content').get(0)
    // The height of the element viewport, without last screen
    const lastScrollHeight = contentElem.scrollHeight - contentElem.offsetHeight

    // Is it at the bottom of page
    if (Math.abs(contentElem.scrollTop - lastScrollHeight) < 3)
        return true

    // Is located in the last screen
    if ($currentHeading.length)
        return contentElem.scrollTop + $currentHeading.offset().top > lastScrollHeight

    return false
}

function renderAsync() {
    const callback = element => {
        let tag = element.tagName.toLowerCase()
        ~(tag === 'pre' ? renderCode :
            tag === 'img' ? renderImage : renderMath)(element)
    }

    for (let el of $('#content img')) {
        el.setAttribute('data-src', el.getAttribute('src'));
        el.removeAttribute('src');
        respondToVisible(el, callback)
    }
    for (let el of $('#content .math, #content pre')) {
        respondToVisible(el, callback)
    }
}

function renderCode(element) {
    cancelToRespond(element)
    if (element.dataset.rendering) return
    else element.dataset.rendering = 'true'

    prism().highlightElement(element)
    element.classList.add('rendered')
    adjustHeading(element)
}

function renderImage(element) {
    cancelToRespond(element)
    if (element.dataset.rendering) return
    else element.dataset.rendering = 'true'

    element.setAttribute('src', element.getAttribute('data-src'))
    element.classList.add('rendered')
    adjustHeading(element)
}

function renderMath(element) {
    cancelToRespond(element)
    if (element.dataset.rendering) return
    else element.dataset.rendering = 'true'

    const text = element.innerText
    if (Store.mathElements[text]) {
        return $(element).replaceWith(Store.mathElements[text].cloneNode(true))
    }

    let math
    const displayMode = element.classList.contains('display')
    if (displayMode) {
        math = text.substr(2, text.length - 5)
    } else {
        math = text.substr(2, text.length - 4)
    }

    Katex.render(math, element, {
        output: 'html',
        throwOnError: false,
        displayMode: displayMode,
    })
    element.classList.add('rendered')
    adjustHeading(element)

    Store.mathElements[text] = element.cloneNode(true)
}

$('#content').on('click', 'a:not(.heading-anchor)', function () {
    const href = $(this).attr('href')
    Store.open(href, ok => {
        if (ok) return
        $(this).attr('target') ? window.open(href) : (location.href = href)
    })

    return false
})

$('#content').on('click', '.heading-anchor', function () {
    const $content = $('#content')
    Store.currentHeading = $(this).parent()

    if (Store.currentHeading.is('.heading:first'))
        scrollTo($content, 0)
    else if (Store.currentHeading.is('.heading:last'))
        scrollTo($content, 99999999)
    else
        scrollTo($content, Store.currentHeading.get(0).offsetTop - parseFloat(Store.currentHeading.css('marginTop')) - parseFloat(Store.currentHeading.css('paddingTop')) + 1)

    syncLocation()
    return false
})

$('#content').on('dblclick', 'pre', function () {
    if (selectionText() === '\n')
        return !copyElementText(this)
})

$('#content').scroll(debounce(() => {
    const $headings = $('#content .heading')
    if ($headings.length === 0) return

    let current
    for (let i = $headings.length - 1; i >= 0; i--) {
        if ($headings.eq(i).position().top <= 0) {
            current = $headings.eq(i)
            break
        }
    }

    if (!current)
        Store.currentHeading = {}
    else if (atBottom(current))
        Store.currentHeading = $headings.last()
    else
        Store.currentHeading = current

    syncLocation()

}, 300))

setTimeout(function watcher() {
    if (!Store.currentFile.path)
        return setTimeout(watcher, 1000)

    $.post(apiEndpoint('stat'), {
        path: Store.currentFile.path
    }).done(function (stat) {
        try {
            stat = JSON.parse(stat)
        } catch (e) {
            stat = {}
        }

        if (stat.updated_at <= Store.currentFile.updated_at) {
            return setTimeout(watcher, 500)
        }

        Store.open(Store.currentFile.path, () => {
            Store.currentFile.updated_at = stat.updated_at
            setTimeout(watcher, 500)
        })
    }).fail(() => setTimeout(watcher, 1000))
}, 500)

export default {adjustHeading, renderAsync}
