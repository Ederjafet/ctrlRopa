package com.hpsqsoft.ctrlropa.security.me;

import com.hpsqsoft.ctrlropa.security.access.AccessService;
import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/access")
public class AccessCheckController {

    private final AccessService accessService;
    private final CurrentUser currentUser;

    public AccessCheckController(AccessService accessService, CurrentUser currentUser) {
        this.accessService = accessService;
        this.currentUser = currentUser;
    }

    @GetMapping("/can")
    public boolean can(@RequestParam String permission,
                       @RequestParam(required = false) String channel,
                       @RequestParam(required = false) Long branchId) {

        Long userId = currentUser.getUserId();

        try {
            if (channel != null && branchId != null) {
                accessService.assertCan(userId, permission, channel, branchId);
            } else {
                accessService.assertCan(userId, permission);
            }
            return true;
        } catch (Exception ex) {
            return false;
        }
    }
}