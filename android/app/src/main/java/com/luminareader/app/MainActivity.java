package com.luminareader.app;

import android.view.KeyEvent;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_VOLUME_DOWN) {
            getBridge().getWebView().evaluateJavascript(
                "window.dispatchEvent(new KeyboardEvent('keydown', { key: 'AudioVolumeDown', code: 'AudioVolumeDown', bubbles: true }));",
                null
            );
            return true;
        } else if (keyCode == KeyEvent.KEYCODE_VOLUME_UP) {
            getBridge().getWebView().evaluateJavascript(
                "window.dispatchEvent(new KeyboardEvent('keydown', { key: 'AudioVolumeUp', code: 'AudioVolumeUp', bubbles: true }));",
                null
            );
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }
}
