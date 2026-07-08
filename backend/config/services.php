<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'groq' => [
        'api_key' => env('GROQ_API_KEY'),
        'api_keys' => array_values(array_filter(array_map(
            static fn (string $item) => trim($item),
            explode(',', (string) env('GROQ_API_KEYS', env('GROQ_API_KEY', '')))
        ))),
        'model' => env('GROQ_MODEL', 'llama-3.3-70b-versatile'),
        'model_fallbacks' => array_values(array_filter(array_map(
            static fn (string $item) => trim($item),
            explode(',', env('GROQ_MODEL_FALLBACKS', 'openai/gpt-oss-120b,openai/gpt-oss-20b,llama-3.1-8b-instant'))
        ))),
        // Windows local PHP often lacks CA certs; set GROQ_VERIFY_SSL=true once php.ini openssl.cafile is set.
        'verify_ssl' => filter_var(env('GROQ_VERIFY_SSL', env('APP_ENV') === 'production' ? 'true' : 'false'), FILTER_VALIDATE_BOOLEAN),
    ],

];
