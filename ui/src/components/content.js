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
    selectionText
} from '@/utils'

const adjustHeading = debounce(() => {
    if (!Store.scrolling || Store.currentHeading.length <= 0)
        return

    if (atBottom())
        Store.currentHeading.find('.heading-anchor').click()
}, 50)

function atBottom() {
    const contentElem = $('#content').get(0)
    // The height of the element viewport, without last screen
    const lastScrollHeight = contentElem.scrollHeight - contentElem.offsetHeight

    // Is it at the bottom of page
    if (Math.abs(contentElem.scrollTop - lastScrollHeight) < 3)
        return true

    // Is located in the last screen
    if (Store.currentHeading.length > 0)
        return contentElem.scrollTop + Store.currentHeading.offset().top > lastScrollHeight

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

    if (element.hasAttribute('data-src')) {
        element.setAttribute('src', element.getAttribute('data-src'))
        element.removeAttribute('data-src')
        adjustHeading(element)
    }
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

$('#content').on('click', '.heading-anchor', function () {
    const $content = $('#content')
    Store.currentHeading = $(this).parent()

    if (Store.currentHeading.is('.heading:first'))
        scrollTo($content, 0)
    else if (Store.currentHeading.is('.heading:last'))
        scrollTo($content, 99999999)
    else
        scrollTo($content, Store.currentHeading.get(0).offsetTop)

    const hash = '#' + decodeURIComponent($(this).parent().attr('id'))
    if (location.hash !== hash)
        location.hash = hash

    return false
})

$('#content').on('dblclick', 'pre', function () {
    if (selectionText() === '\n')
        return !copyElementText(this)
})

$('#content').scroll(debounce(() => {
    const $headings = $('#content .heading')
    if ($headings.length === 0) return

    let flag = false
    for (let i = $headings.length - 1; i >= 0; i--) {
        const $heading = $headings.eq(i)
        if ($heading.position().top <= 0) {
            [flag, Store.currentHeading] = [true, $heading]
            break
        }
    }

    if (!flag)
        Store.currentHeading = $headings.first()
    else if (atBottom())
        Store.currentHeading = $headings.last()

    history.pushState(null, '', Store.currentFile.path + '#' + Store.currentHeading.attr('id'))

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
