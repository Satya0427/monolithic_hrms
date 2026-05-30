const MESSAGES = {

    SUCCESS: 'Success',
    SOMETHING_WENT_WRONG: 'Something went wrong, please try again',
    INTERNAL_SERVER_ERROR: 'Internal server error',

    PAGE_SIZE_REQUIRED: 'Page size is required',
    PAGE_SIZE_TYPE: 'Page size must be a number',
    PAGE_SIZE_MIN: 'Page size must be atleast 1',
    PAGE_SIZE_INVALID: 'Page size is invalid',

    PAGE_INDEX_REQUIRED: 'Page index is required',
    PAGE_INDEX_TYPE: 'Page index must be a number',
    PAGE_INDEX_MIN: 'Page index must be atleast 1',
    PAGE_INDEX_INVALID: 'Page index is invalid',

    SEARCH_KEY_REQUIRED: 'Search key is required',
    SEARCH_KEY_TYPE: 'Search key must be a string',
    SEARCH_KEY_INVALID: 'Search key is invalid',

    NAME: {
        REQUIRED: 'User name is required',
        TYPE: 'User name must be a string',
        MIN: 'User name must have atleast 3 characters',
        INVALID: 'User name is invalid',
    },
    EMAIL: {
        REQUIRED: 'Email is required',
        TYPE: 'Email must be a string',
        MAX: 'Email must not exceed 250 characters',
        INVALID: 'Email is invalid',
        EXISTS: 'Email is already  exists',
    },
    PASSWORD: {
        REQUIRED: 'Password is required',
        TYPE: 'Password must be a string',
        MIN: 'Password must have atleast 3 characters',
        INVALID: 'Password is invalid',
        INCORRECT: 'Password is incorrect',
    },
    PHONE_NUMBER: {
        REQUIRED: 'Phone number is required',
        TYPE: 'Phone number must be a string',
        MIN: 'Phone number must have atleast 7 characters',
        INVALID: 'Phone number is invalid',
        INCORRECT: 'Phone number is incorrect',
    },

    USER_ID_REQUIRED: 'User ID is required',
    USER_ID_TYPE: 'User ID must be a string',
    USER_ID_INVALID: 'User ID is invalid',

    USER_NOT_FOUND: 'User not found',

    AUTHORIZATION_HEADER_MISSING: 'Authorization header missing',

    UNAUTHORIZED_ACCESS: 'Unauthorized to access the service',

    ACCESS_TOKEN_MISSING: 'Access token is missing',
    ACCESS_TOKEN_INVALID: 'Access token is invalid or expired',

    REFRESH_TOKEN_REQUIRED: 'Refresh token is required',
    REFRESH_TOKEN_INVALID: 'Refresh token is invalid or expired',

    BOOK_TITLE_REQUIRED: 'Title is required',
    BOOK_TITLE_TYPE: 'Title must be a string',
    BOOK_TITLE_MIN: 'Title must have atleast 3 characters',
    BOOK_TITLE_INVALID: 'Title is invalid',

    AUTHOR_REQUIRED: 'Author is required',
    AUTHOR_TYPE: 'Author must be a string',
    AUTHOR_MIN: 'Author must have atleast 3 characters',
    AUTHOR_INVALID: 'Author is invalid',

    ISBN_REQUIRED: 'ISBN is required',
    ISBN_TYPE: 'ISBN must be a string',
    ISBN_INVALID: 'ISBN is invalid',
    ISBN_EXISTS: 'ISBN already exists',

    PUBLICATION_DATE_REQUIRED: 'Publication date is required',
    PUBLICATION_DATE_TYPE: 'Publication date must be a string',
    PUBLICATION_DATE_INVALID: 'Publication date is invalid',
    PUBLICATION_DATE_FUTURE: 'Publication date must not be a future date',

    BOOK_COPIES_REQUIRED: 'Copies is required',
    BOOK_COPIES_TYPE: 'Copies must be a number',
    BOOK_COPIES_MIN: 'Copies must be atleast 1',
    BOOK_COPIES_INVALID: 'Copies is invalid',

    BOOK_GENRE_REQUIRED: 'Genre is required',
    BOOK_GENRE_TYPE: 'Genre must be an array',
    BOOK_GENRE_INVALID: 'Genre is invalid',
    BOOK_GENRE_DUPLICATE: 'Genres are duplicated',

    BOOK_ID_REQUIRED: 'Book ID is required',
    BOOK_ID_TYPE: 'Book ID must be a string',
    BOOK_ID_INVALID: 'Book ID is invalid',

    BORROWED_ID_REQUIRED: 'Borrowed ID is required',
} as const;

export { MESSAGES };
