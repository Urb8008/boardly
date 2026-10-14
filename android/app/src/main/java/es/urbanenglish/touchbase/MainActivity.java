package es.urbanenglish.touchbase;

import android.net.Uri;
import android.os.Bundle;
import android.webkit.PermissionRequest;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getBridge().getWebView().setWebChromeClient(
            new BridgeWebChromeClient(getBridge()) {
                @Override
                public void onPermissionRequest(final PermissionRequest request) {
                    Uri origin = request.getOrigin();
                    String host = origin != null ? origin.getHost() : null;

                    if (host != null &&
                        (host.equals("8x8.vc") || host.endsWith(".8x8.vc"))) {
                        runOnUiThread(() ->
                            request.grant(request.getResources())
                        );
                        return;
                    }

                    super.onPermissionRequest(request);
                }
            }
        );
    }
}
