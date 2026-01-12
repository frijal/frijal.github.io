<?php
declare(strict_types=1);

/**
 * AdSense-style Page Check (single-file PHP)
 *
 * - Fetches a URL
 * - Computes a simple text-to-HTML ratio
 * - Scans for basic sensitive-topic words
 * - Scans for common extra-window / interstitial-style markers
 *
 * This is NOT an official Google tool. It just helps you spot
 * obvious issues before you submit pages for review.
 */

function h(string $s): string {
  return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/**
 * Fetch a URL using cURL if available, fallback to file_get_contents.
 *
 * @return array{ok:bool, error:?string, status:?int, html:?string}
 */
function fetch_page(string $url): array {
  $result = [
    'ok'     => false,
    'error'  => null,
    'status' => null,
    'html'   => null,
  ];

  if (!preg_match('~^https?://~i', $url)) {
    $url = 'https://' . $url;
  }

  if (!filter_var($url, FILTER_VALIDATE_URL)) {
    $result['error'] = 'Invalid URL.';
    return $result;
  }

  // Prefer cURL for better status info
  if (function_exists('curl_init')) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_FOLLOWLOCATION => true,
      CURLOPT_MAXREDIRS      => 5,
      CURLOPT_CONNECTTIMEOUT => 8,
      CURLOPT_TIMEOUT        => 15,
      CURLOPT_USERAGENT      => 'VibeScriptz-PageCheck/1.0',
    ]);

    $body   = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err    = curl_error($ch);
    curl_close($ch);

    if ($body === false || $body === '') {
      $result['error']  = $err ?: 'Empty response';
      $result['status'] = $status ?: null;
      return $result;
    }

    $result['ok']     = true;
    $result['html']   = $body;
    $result['status'] = $status;
    return $result;
  }

  // Fallback if cURL is not available
  $ctx = stream_context_create([
    'http' => [
      'method'  => 'GET',
      'timeout' => 15,
      'header'  => "User-Agent: VibeScriptz-PageCheck/1.0\r\n",
    ],
  ]);

  $body = @file_get_contents($url, false, $ctx);

  if ($body === false || $body === '') {
    $result['error'] = 'Failed to fetch URL';
    return $result;
  }

  $result['ok']   = true;
  $result['html'] = $body;
  return $result;
}

/**
 * Analyze text-to-HTML ratio.
 *
 * @return array{textLen:int, htmlLen:int, ratio:float, label:string, text:string}
 */
function analyze_text_ratio(string $html): array {
  $htmlLen = strlen($html);

  // Strip tags and decode entities to approximate visible text
  $text = strip_tags($html);
  $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
  $text = preg_replace('/\s+/', ' ', $text);
  $text = trim($text);

  $textLen = function_exists('mb_strlen')
    ? mb_strlen($text, 'UTF-8')
    : strlen($text);

  $ratio = $htmlLen > 0 ? $textLen / $htmlLen : 0.0;

  if ($ratio >= 0.25) {
    $label = 'OK (good amount of text)';
  } elseif ($ratio >= 0.15) {
    $label = 'Borderline (consider adding more text)';
  } elseif ($ratio >= 0.10) {
    $label = 'Low (may look thin)';
  } else {
    $label = 'Very low (very thin content)';
  }

  return [
    'textLen' => $textLen,
    'htmlLen' => $htmlLen,
    'ratio'   => $ratio,
    'label'   => $label,
    'text'    => $text,
  ];
}

/**
 * Scan for simple keyword markers.
 *
 * @param string   $haystack text or HTML
 * @param string[] $markers
 * @return array<string,int> marker => count
 */
function scan_markers(string $haystack, array $markers): array {
  $found    = [];
  $haystack = strtolower($haystack);

  foreach ($markers as $m) {
    $needle = strtolower($m);
    $count  = substr_count($haystack, $needle);
    if ($count > 0) {
      $found[$m] = $count;
    }
  }

  return $found;
}

// Example configurable marker lists.
// On your own copy, replace these with real terms you want to flag.

$sensitiveMarkers = [
  'sensitive_term_one',
  'sensitive_term_two',
  'sensitive_term_three',
  'sensitive_term_four',
];

$extraWindowMarkers = [
  'extra_window_pattern_one',
  'extra_window_pattern_two',
  'overlay_pattern',
  'new_window_script_pattern',
];

$url     = isset($_GET['url']) ? trim((string)$_GET['url']) : '';
$results = null;
$error   = null;

if ($url !== '') {
  $fetch = fetch_page($url);

  if (!$fetch['ok']) {
    $error = $fetch['error'] ?? 'Unknown error';
  } else {
    $html  = $fetch['html'] ?? '';
    $ratio = analyze_text_ratio($html);

    // Remove <pre> and <code> blocks when scanning for markers,
    // so code samples don't trigger the warnings.
    $cleanForMarkers = preg_replace('~<(pre|code)\b[^>]*>.*?</\1>~is', ' ', $html);

    // Build a plain-text version (without tags and without code blocks)
    $cleanText = strip_tags($cleanForMarkers);
    $cleanText = html_entity_decode($cleanText, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $cleanText = preg_replace('/\s+/', ' ', $cleanText);
    $cleanText = trim($cleanText);

    $sensitiveFound = scan_markers($cleanText, $sensitiveMarkers);
    $extraFound     = scan_markers($cleanForMarkers, $extraWindowMarkers);

    $results = [
      'status'    => $fetch['status'],
      'ratio'     => $ratio,
      'sensitive' => $sensitiveFound,
      'extra'     => $extraFound,
    ];
  }
}
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>AdSense-style Page Check</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      margin: 20px;
      background: #0b1020;
      color: #f9fafb;
      line-height: 1.5;
    }
    h1 {
      margin-top: 0;
      font-size: 22px;
    }
    form {
      margin: 12px 0;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    input[type="text"] {
      flex: 1;
      min-width: 220px;
      padding: 6px 8px;
      border-radius: 999px;
      border: 1px solid #4b5563;
      background: #020617;
      color: #e5e7eb;
    }
    input[type="submit"] {
      padding: 6px 14px;
      border-radius: 999px;
      border: 0;
      background: #4f46e5;
      color: #f9fafb;
      cursor: pointer;
      font-weight: 600;
    }
    input[type="submit"]:hover {
      background: #6366f1;
    }
    .small {
      font-size: 13px;
      color: #9ca3af;
    }
    .error {
      padding: 8px 10px;
      background: #7f1d1d;
      color: #fee2e2;
      border-radius: 8px;
      margin-top: 8px;
      font-size: 14px;
    }
    .box {
      margin-top: 14px;
      padding: 10px 12px;
      border-radius: 10px;
      background: #020617;
      border: 1px solid #4b5563;
      font-size: 14px;
    }
    ul {
      margin: 6px 0 0 20px;
      padding: 0;
    }
  </style>
</head>
<body>
  <h1>AdSense-style Page Check</h1>

  <p>
    Paste a public URL and this script will fetch the page, estimate the text-to-HTML ratio,
    and look for simple sensitive-topic and extra-window markers. It is not an official Google tool,
    just a helper to see obvious issues before you add ad code or request review.
  </p>

  <form method="get" action="">
    <input
      type="text"
      name="url"
      placeholder="https://example.com/your-page"
      value="<?php echo $url !== '' ? h($url) : ''; ?>"
    >
    <input type="submit" value="Check page">
  </form>

  <p class="small">
    Hint: this only looks at HTML and text, not how ad scripts behave at runtime.
    Always read the official AdSense policies.
  </p>

  <?php if ($error !== null): ?>
    <div class="error"><?php echo h($error); ?></div>
  <?php endif; ?>

  <?php if ($results !== null && $error === null): ?>
    <div class="box">
      <strong>HTTP status:</strong>
      <?php
        if ($results['status'] === null) {
          echo 'Unknown (no status available)';
        } else {
          $s = (int)$results['status'];
          echo $s;
          if ($s >= 200 && $s < 300) {
            echo ' &ndash; looks OK';
          } elseif ($s >= 300 && $s < 400) {
            echo ' &ndash; redirect (check final URL)';
          } else {
            echo ' &ndash; error status (not ad-ready)';
          }
        }
      ?>
      <br><br>

      <?php
        $r       = $results['ratio'];
        $percent = $r['htmlLen'] > 0 ? round($r['ratio'] * 100, 1) : 0.0;
      ?>
      <strong>Text-to-HTML ratio:</strong>
      <?php echo $percent; ?>% text<br>
      <?php echo h($r['label']); ?><br>
      ~<?php echo (int)$r['textLen']; ?> characters of visible text
      <br><br>

      <strong>Sensitive-topic markers:</strong>
      <?php if (empty($results['sensitive'])): ?>
        none found
      <?php else: ?>
        <ul>
          <?php foreach ($results['sensitive'] as $marker => $count): ?>
            <li><?php echo h($marker); ?> (<?php echo (int)$count; ?>)</li>
          <?php endforeach; ?>
        </ul>
      <?php endif; ?>
      <br>

      <strong>Extra-window / overlay signals:</strong>
      <?php if (empty($results['extra'])): ?>
        none found
      <?php else: ?>
        <ul>
          <?php foreach ($results['extra'] as $marker => $count): ?>
            <li><?php echo h($marker); ?> (<?php echo (int)$count; ?>)</li>
          <?php endforeach; ?>
        </ul>
      <?php endif; ?>

      <p class="small" style="margin-top:10px;">
        Passing these checks does not guarantee approval; failing them just points to places
        to review. Use this as a quick preflight, not a full policy engine.
      </p>
    </div>
  <?php endif; ?>
</body>
</html>
