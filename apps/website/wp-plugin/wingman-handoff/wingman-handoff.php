<?php
/**
 * Plugin Name: Wingman Handoff
 * Description: Authenticates premium users and redirects them to the Wingman agent dashboard.
 * Version:     1.0.0
 */

if (!defined('ABSPATH')) exit;

if (!defined('WINGMAN_HANDOFF_SECRET')) {
    define('WINGMAN_HANDOFF_SECRET', getenv('WINGMAN_HANDOFF_SECRET') ?: '');
}

add_action('init', function () {
    if (!isset($_GET['open-wingman'])) return;

    if (!is_user_logged_in()) {
        wp_redirect(wp_login_url(home_url('?open-wingman=1')));
        exit;
    }

    $user = wp_get_current_user();
    $premium_roles = ['premium', 'pro', 'enterprise', 'subscriber'];
    $has_premium   = (bool) array_intersect($premium_roles, $user->roles);

    if (!$has_premium) {
        wp_redirect(home_url('/pricing/?reason=premium_required'));
        exit;
    }

    $response = wp_remote_post('https://ditto-wingman-backend-production.up.railway.app/api/auth/token', [
        'headers' => ['Content-Type' => 'application/json'],
        'body'    => json_encode([
            'sub'       => (string) $user->ID,
            'email'     => $user->user_email,
            'plan'      => 'premium',
            'name'      => $user->display_name,
            'avatarUrl' => get_avatar_url($user->ID),
            'secret'    => WINGMAN_HANDOFF_SECRET,
        ]),
        'timeout' => 15,
    ]);

    if (is_wp_error($response) || wp_remote_retrieve_response_code($response) !== 200) {
        wp_die('Could not launch Wingman. Please try again later.');
    }

    $data = json_decode(wp_remote_retrieve_body($response), true);
    wp_redirect('https://agent.thekpihub.com/dashboard?token=' . $data['token']);
    exit;
});

add_shortcode('open_wingman_button', function () {
    if (!is_user_logged_in()) return '';
    $url = esc_url(home_url('?open-wingman=1'));
    return '<a href="' . $url . '" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Open Ditto Wingman ↗</a>';
});
