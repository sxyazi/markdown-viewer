import $ from 'jquery'
import Store from '@/store'
import '@/components/sidebar'
import '@/components/outline'

$('aside').addClass(localStorage.getItem('ui:sidebar') === 'inactive' ? 'fold' : '')
$('#outline').addClass(localStorage.getItem('ui:outline') === 'active' ? 'active' : '')

window.addEventListener('popstate', () => {
    Store.currentHeading = $('.heading[id="' + decodeURIComponent(location.hash.substr(1)) + '"]')

    if (Store.currentFile.path !== decodeURIComponent(location.pathname)) {
        Store.openRecent()
    }
})
