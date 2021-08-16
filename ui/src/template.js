import $ from 'jquery'
import katex from 'katex/dist/katex'
import {cancelToRespond, copyElementText, debounce, respondToVisible, selectionText} from './utils'

var readjust = false
var allFiles = {}
var currentFile = {}
var currentHeading = {}
var mathElements = {}
var fileTemplate = $('#file-template').html()

var adjustHeading = debounce(function () {
    if (!readjust) return

    readjust = false
    var $content = $('#content')
    $content.animate({scrollTop: currentHeading.get(0).offsetTop}, 50)
}, 50)

function open(path, done) {
    if (!allFiles.list) {
        return done(false)
    }

    var file = null
    var isSwitch = false
    for (var i = 0; i < allFiles.list.length; i++) {
        if (path === allFiles.list[i].path) {
            file = allFiles.list[i]
            break
        }
    }

    if (!file) {
        return done(false)
    }

    isSwitch = file.path !== currentFile.path
    currentFile = file
    localStorage.setItem('recent:' + allFiles.root, file.path)

    scrollToFit()
    $('#files li').removeClass('active')
    $('#files li[path="' + file.path + '"]').addClass('active')
    if (file.path !== decodeURIComponent(location.pathname)) {
        history.pushState(null, '', file.path)
    }

    $.post(apiEndpoint('file'), {
        path: file.path
    }, function (html) {
        $('#content').html(html)

        var toc = $('#table-of-contents').html()
        $('#outline').html() !== toc && $('#outline').html(toc)
        $('#table-of-contents').remove()
        renderMathAsync()

        currentHeading = $('.heading[id="' + decodeURIComponent(location.hash.substr(1)) + '"]')
        if (isSwitch && currentHeading.length === 0) {
            $('#content').animate({scrollTop: 0}, 100)
        } else if (isSwitch) {
            readjust = true
            currentHeading.find('.heading-anchor').click()
        }

        done && done(file)
    })
}

function openRecent(done) {
    var path
    if (/\.md$/.test(location.pathname)) {
        path = decodeURIComponent(location.pathname)
    } else {
        path = localStorage.getItem('recent:' + allFiles.root)
    }

    open(path, done)
}

function openReadme(done) {
    if (!allFiles.list) {
        return done(false)
    }

    var finds = []
    for (var i = 0; i < allFiles.list.length; i++) {
        if (allFiles.list[i].name.toLowerCase() === 'readme.md') {
            finds.push(allFiles.list[i].path)
        }
    }

    if (finds.length < 1) {
        return done(false)
    }

    finds.sort(function (a, b) {
        return a.length > b.length ? 1 : -1
    })

    open(finds.shift(), done)
}

function openFirst(done) {
    if (allFiles.list && allFiles.list.length > 0) {
        return open(allFiles.list[0].path, done)
    }

    return done(false)
}

function atBottom() {
    var contentElem = $('#content').get(0)
    // The height of the element viewport without last screen
    var lastScrollHeight = contentElem.scrollHeight - contentElem.offsetHeight

    // Is it at the bottom of page
    if (Math.abs(contentElem.scrollTop - lastScrollHeight) < 3) {
        return true
    }

    // Is located in the last screen
    if (currentHeading.length) {
        return contentElem.scrollTop + currentHeading.offset().top > lastScrollHeight
    }

    return false
}

function scrollToFit() {
    var filesElem = $('#files')
    var fileElem = filesElem.find('li[path="' + currentFile.path + '"]')
    var scrollTop = fileElem.offset().top - filesElem.offset().top + filesElem.scrollTop()

    if (scrollTop > filesElem.scrollTop() + filesElem.height()) {
        filesElem.animate({scrollTop: scrollTop}, 100)
    }
}

function renderImage(element) {
    cancelToRespond(element)
    if (!element.hasAttribute('data-src')) {
        return
    }

    element.setAttribute('src', element.getAttribute('data-src'))
    element.removeAttribute('data-src')
    adjustHeading()
}

function renderMath(element) {
    cancelToRespond(element)
    if (element.classList.contains('rendered')) {
        return
    } else {
        element.classList.add('rendered')
    }

    var text = element.innerText
    if (mathElements[text]) {
        return $(element).replaceWith(mathElements[text].cloneNode(true))
    }

    var displayMode = element.classList.contains('display')
    if (displayMode) {
        var math = text.substr(2, text.length - 5)
    } else {
        var math = text.substr(2, text.length - 4)
    }

    katex.render(math, element, {
        output: 'html',
        throwOnError: false,
        displayMode: displayMode,
    })
    adjustHeading()

    mathElements[text] = element.cloneNode(true)
}

function renderMathAsync() {
    var callback = function (element) {
        (element.tagName.toLowerCase() === 'img' ? renderImage : renderMath)(element)
    }

    for (var i = 0, elems = $('#content img'); i < elems.length; i++) {
        elems[i].setAttribute('data-src', elems[i].getAttribute('src'));
        elems[i].removeAttribute('src');
        respondToVisible(elems[i], callback)
    }
    for (var i = 0, elems = $('#content .math'); i < elems.length; i++) {
        respondToVisible(elems[i], callback)
    }
}

function apiEndpoint(url) {
    if (location.port === '3000') {
        return `/${url}`
    }

    return `http://127.0.0.1:3000/${url}`
}

$('aside').addClass(localStorage.getItem('ui:sidebar') === 'inactive' ? 'fold' : '')
$('#outline').addClass(localStorage.getItem('ui:outline') === 'active' ? 'active' : '')

$.get(apiEndpoint('files'), function (files) {
    try {
        allFiles = JSON.parse(files)
    } catch (e) {
        allFiles = {}
    }

    for (var i = 0; i < allFiles.list.length; i++) {
        var file = $(fileTemplate)
        file.text(allFiles.list[i].name)
        file.attr('path', allFiles.list[i].path)
        file.attr('title', allFiles.list[i].path)

        $('#files').append(file)
    }

    (function openQueue(queue) {
        var fn = queue.shift()
        fn && fn(function (flag) {
            flag || openQueue(queue)
        })
    })([openRecent, openReadme, openFirst])
})

$('#switch').click(function () {
    var asideEle = $('aside')
    if (asideEle.width() >= 16) {
        asideEle.removeClass('unfold').addClass('fold')
    } else {
        asideEle.removeClass('fold').addClass('unfold')
    }
    localStorage.setItem('ui:sidebar', asideEle.hasClass('fold') ? 'inactive' : 'active')
})

$('#files').on('click', 'li', function () {
    open($(this).attr('path'))
})

$('#outline').click(function (e) {
    if (this === e.target) {
        $(this).toggleClass('active')
        localStorage.setItem('ui:outline', $(this).hasClass('active') ? 'active' : 'inactive')
    }
})

$('#content').on('click', '.heading-anchor', function () {
    var contentElem = $('#content')
    currentHeading = $(this).parent()
    contentElem.animate({scrollTop: contentElem.scrollTop() + $(this).offset().top}, 100)

    var hash = '#' + decodeURIComponent($(this).parent().attr('id'))
    if (location.hash !== hash) {
        location.hash = hash
    }

    return false
})

$('#content').on('dblclick', 'pre', function (e) {
    if (selectionText() === '\n') {
        return !copyElementText(this)
    }
})

$('#content').scroll(debounce(function () {
    var headingElems = $('#content .heading')
    for (var i = headingElems.length - 1; i >= 0; i--) {
        var $e = headingElems.eq(i)
        if ($e.position().top <= 0) {
            currentHeading = $e
            history.pushState(null, '', currentFile.path + '#' + currentHeading.attr('id'))
            break
        }
    }

    if (atBottom()) {
        currentHeading = headingElems.last()
        var id = currentHeading.attr('id')
        return id && history.pushState(null, '', currentFile.path + '#' + id)
    }
}, 300))

window.addEventListener('popstate', function () {
    currentHeading = $('.heading[id="' + decodeURIComponent(location.hash.substr(1)) + '"]')

    if (currentFile.path !== decodeURIComponent(location.pathname)) {
        openRecent()
    }
})

setTimeout(function watcher() {
    if (!currentFile.path) {
        return setTimeout(watcher, 1000)
    }

    $.post(apiEndpoint('stat'), {
        path: currentFile.path
    }).done(function (stat) {
        try {
            stat = JSON.parse(stat)
        } catch (e) {
            stat = {}
        }

        if (stat.updated_at <= currentFile.updated_at) {
            return setTimeout(watcher, 500)
        }

        open(currentFile.path, function () {
            currentFile.updated_at = stat.updated_at
            setTimeout(watcher, 500)
        })
    }).fail(function () {
        return setTimeout(watcher, 1000)
    })
}, 500)
