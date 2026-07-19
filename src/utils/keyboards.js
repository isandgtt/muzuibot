import locale from '../locales/id.js';

export const idleKeyboard = {
    keyboard: [
        [{ text: locale.btn_findPartner }],
        [{ text: locale.btn_searchGender }],
        [{ text: locale.btn_profile }, { text: locale.btn_settings }],
        [{ text: locale.btn_help }]
    ],
    resize_keyboard: true,
    is_persistent: true
};

export const chattingKeyboard = {
    keyboard: [
        [{ text: locale.btn_next }, { text: locale.btn_stop }],
        [{ text: locale.btn_rules }]
    ],
    resize_keyboard: true,
    is_persistent: true
};

export const inlineGenderKeyboard = {
    inline_keyboard: [
        [{ text: '👦 Male', callback_data: 'gender_male' }, { text: '👧 Female', callback_data: 'gender_female' }]
    ]
};

export const inlinePrefKeyboard = {
    inline_keyboard: [
        [{ text: 'Male', callback_data: 'pref_male' }, { text: 'Female', callback_data: 'pref_female' }, { text: 'Random', callback_data: 'pref_random' }]
    ]
};

export const searchGenderKeyboard = {
    inline_keyboard: [
        [{ text: '👦 Male', callback_data: 'search_male' }, { text: '👧 Female', callback_data: 'search_female' }, { text: '🎲 Random', callback_data: 'search_random' }]
    ]
};

export const deleteConfirmKeyboard = {
    inline_keyboard: [
        [{ text: 'Yes', callback_data: 'del_yes' }, { text: 'No', callback_data: 'del_no' }]
    ]
};

export const settingsKeyboard = {
    inline_keyboard: [
        [{ text: 'Change Gender', callback_data: 'set_gender' }],
        [{ text: 'Change Preference', callback_data: 'set_pref' }],
        [{ text: 'Change City', callback_data: 'set_city' }],
        [{ text: 'Delete Profile', callback_data: 'set_delete' }],
        [{ text: 'Back', callback_data: 'set_back' }]
    ]
};
