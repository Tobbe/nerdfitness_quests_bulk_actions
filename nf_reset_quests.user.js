// ==UserScript==
// @name         Nerd Fitness Quest bulk actions
// @namespace    https://github.com/tobbe
// @version      0.3
// @description  Adds a button to perform quest bulk actions
// @license      MIT
// @author       Tobbe
// @match        https://www.nerdfitness.com/level-up/my-quests/
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    GM_addStyle(`
        .quests-bread {
            position: relative;
            float: right;
            top: 0;
        }

        /* The Modal (background) */
        .modal {
            display: none;
            position: fixed;
            z-index: 100;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            overflow: auto; /* Enable scroll if needed */
            background-color: rgba(0, 0, 0, 0.4);
        }

        /* Modal Content/Box */
        .modal-content {
            background-color: #fefefe;
            margin: 15% auto; /* 15% from the top and centered */
            padding: 20px;
            border: 1px solid #888;
            width: 80%;
        }

        .modal-content fieldset {
            margin-bottom: 20px;
        }

        .modal-content fieldset label {
            display: block;
            margin-bottom: 10px;
        }

        .modal-content fieldset input[type="radio"] {
            margin: 1px 6px 0 0;
        }

        .modal-content button {
            border-radius: 5px;
            padding: 4px 10px;
        }

        @media screen and (min-width: 1023px) {
            .modal-content {
                width: 60%;
            }
        }

        /* The Close Button */
        .close {
            color: #aaa;
            float: right;
            font-size: 28px;
            font-weight: bold;
        }

        .close:hover,
        .close:focus {
            color: black;
            text-decoration: none;
            cursor: pointer;
        }
    `);

    function htmlToElement(html) {
        const template = document.createElement('template');
        template.innerHTML = html.trim();
        return template.content.firstChild;
    }

    function createModal(id, content, action) {
        const modalHtml = `
            <div id="${id}" class="modal">
                <div class="modal-content">
                    <span id="${id}-close" class="close">&times;</span>
                    ${content}
                </div>
            </div>
        `;

        const modalDiv = htmlToElement(modalHtml);

        document.body.appendChild(modalDiv);

        const actionElement = document.getElementById(id + '-action');
        if (actionElement) {
          actionElement.onclick = () => {
            action();
            modalDiv.style.display = 'none';
          };
        }

        // Get the <span> element that closes the modal
        const span = document.getElementById(id + '-close');

        // When the user clicks on <span> (x), close the modal
        span.onclick = () => {
            modalDiv.style.display = 'none';
        }

        // When the user clicks anywhere outside of the modal, close it
        modalDiv.onclick = event => {
            if (event.target === modalDiv) {
                modalDiv.style.display = 'none';
            }
        }

        return modalDiv;
    }

    function performBulkActions(completedValue, starredValue) {
        const url = 'https://www.nerdfitness.com/wp-admin/admin-ajax.php?action=alm_query_posts&query_type=standard&nonce=6bc113fe44&repeater=template_2&theme_repeater=null&cta=&comments=&post_type%5B%5D=nfq_quest&post_format=&category=&category__not_in=&tag=&tag__not_in=&taxonomy=nfq_quest_category&taxonomy_terms=adventurer%2Cassassin%2Cdruid%2Cmonk%2Cranger%2Crebel%2Cscout%2Cwarrior%2Cacademy%2Cfitness%2Cmindset%2Cnutrition%2Cyoga&taxonomy_operator=&taxonomy_relation=&meta_key=&meta_value=&meta_compare=&meta_relation=&meta_type=&author=&year=&month=&day=&post_status=&order=DESC&orderby=date&post__in=&post__not_in=&exclude=&search=&custom_args=&posts_per_page=10000&page=0&offset=0&preloaded=false&seo_start_page=1&paging=false&previous_post=false&previous_post_id=&previous_post_taxonomy=&lang=&slug=my-quests&canonical_url=https%3A%2F%2Fwww.nerdfitness.com%2Flevel-up%2Fmy-quests%2F';

        fetch(url).then(data => data.json()).then(res => {
            const quests = res.html.split('<?php');
            const promises = [];
            quests.forEach(quest => {
                const idIndex = quest.indexOf('data-id="') + 'data-id="'.length;
                const idEndIndex = quest.indexOf('"', idIndex + 1);
                const id = quest.slice(idIndex, idEndIndex);
                const completed = quest.indexOf('q-complete') > -1;
                const starred = quest.indexOf('class="qh-star active"') > -1;

                let toggleCompleted = false;

                if (completed) {
                    if (completedValue === 'all-quests' ||
                        completedValue === 'starred-quests' && starred ||
                        completedValue === 'un-starred-quests' && !starred) {
                        toggleCompleted = true;
                    }
                }

                let toggleStarred = false;

                if (starred) {
                    if (starredValue === 'starred-all-quests' ||
                        starredValue === 'starred-completed-quests' && completed ||
                        starredValue === 'starred-uncompleted-quests' && !completed) {
                        toggleStarred = true;
                    }
                }

                const fetchConfig = {
                    body: new URLSearchParams('action=nfq_update_user_meta&security=&req=complete_quest&pid=' + id),
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    credentials: 'same-origin',
                };

                const fetchConfigStarred = {
                    body: new URLSearchParams('action=nfq_update_user_meta&security=&req=favorite_quest&pid=' + id),
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    credentials: 'same-origin',
                };

                if (toggleCompleted) {
                    promises.push(fetch('https://www.nerdfitness.com/wp-admin/admin-ajax.php', fetchConfig));
                }

                if (toggleStarred) {
                    promises.push(fetch('https://www.nerdfitness.com/wp-admin/admin-ajax.php', fetchConfigStarred));
                }
            });

            Promise.all(promises)
                .then(() => window.location.reload())
                .catch(error => console.error('error:', error));
        });
    }

    function confirmBulkActions() {
        if (window.confirm('Do you really want to perform these bulk actions?'')) {
            const completedValue =
                bulkActionsModal.querySelector('input[name="completed"]:checked').id;
            const starredValue =
                bulkActionsModal.querySelector('input[name="starred"]:checked').id;

            performBulkActions(completedValue, starredValue);
            progressModal.style.display = 'block';
        }
    }

    const modalContent = `
        <fieldset>
            <legend>Completed status</legend>

            <label for="no-quests"><input type="radio" id="no-quests" name="completed" checked> Don't change completed status</label>
            <label for="all-quests"><input type="radio" id="all-quests" name="completed"> Mark all quests as not completed</label>
            <label for="starred-quests"><input type="radio" id="starred-quests" name="completed"> Mark starred quests as not completed</label>
            <label for="un-starred-quests"><input type="radio" id="un-starred-quests" name="completed"> Mark un-starred quests as not completed</label>
        </fieldset>

        <fieldset>
            <legend>Starred status</legend>

            <label for="starred-no-quests"><input type="radio" id="starred-no-quests" name="starred" checked> Don't change starred status</label>
            <label for="starred-all-quests"><input type="radio" id="starred-all-quests" name="starred"> Unstar all quests</label>
            <label for="starred-completed-quests"><input type="radio" id="starred-completed-quests" name="starred"> Unstar all completed quests</label>
            <label for="starred-uncompleted-quests"><input type="radio" id="starred-uncompleted-quests" name="starred"> Unstar all not completed quests</label>
        </fieldset>

        <button id="bulk-actions-modal-action">Continue</button>
    `;

    const bulkActionsModal = createModal('bulk-actions-modal', modalContent, confirmBulkActions);
    const progressModal = createModal('progress-modal', 'Bulk actions in progress, please wait...');

    const bulkActionsBtn = htmlToElement('<a class="subbtn">Quest bulk actions</a>');

    bulkActionsBtn.onclick = () => {
        bulkActionsModal.style.display = 'block';
    };

    const buttonContainer = document.querySelector('.fx-inner-cont');
    buttonContainer.insertBefore(bulkActionsBtn, buttonContainer.firstChild);

    document.querySelectorAll('.quests-bread')[1].style = '';
})();