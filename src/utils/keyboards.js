export const genderKeyboard = {
    inline_keyboard: [
        [
            { text: '👦 Male', callback_data: 'gender_male' },
            { text: '👧 Female', callback_data: 'gender_female' }
        ]
    ]
};

export const preferenceKeyboard = {
    inline_keyboard: [
        [
            { text: 'Male', callback_data: 'pref_male' },
            { text: 'Female', callback_data: 'pref_female' },
            { text: 'Random', callback_data: 'pref_random' }
        ]
    ]
};
