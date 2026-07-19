export const STATE = {
    NEW: 'NEW',
    PROFILE_SETUP: 'PROFILE_SETUP',
    IDLE: 'IDLE',
    SEARCHING: 'SEARCHING',
    MATCHING: 'MATCHING',
    MATCHED: 'MATCHED',
    DISCONNECTED: 'DISCONNECTED',
    BANNED: 'BANNED'
};

export const SESSION_STATE = {
    CREATING: 'CREATING',
    ACTIVE: 'ACTIVE',
    ENDING: 'ENDING',
    ENDED: 'ENDED'
};

export const END_REASON = {
    NEXT: 'NEXT',
    STOP: 'STOP',
    TIMEOUT: 'TIMEOUT'
};

export const COMMANDS = {
    START: '/start',
    SEARCH: '/search',
    NEXT: '/next',
    STOP: '/stop',
    PROFILE: '/profile',
    SETTINGS: '/settings',
    HELP: '/help'
};
