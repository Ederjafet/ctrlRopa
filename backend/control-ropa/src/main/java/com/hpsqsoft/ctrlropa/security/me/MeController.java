package com.hpsqsoft.ctrlropa.security.me;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/me")
public class MeController {

    private final MeService service;

    public MeController(MeService service) {
        this.service = service;
    }

    @GetMapping
    public MeResponse getMe() {
        return service.getMe();
    }

    @GetMapping("/permissions")
    public List<MeResponse.PermissionInfo> getPermissions() {
        return service.getPermissions();
    }

    @GetMapping("/channels")
    public List<MeResponse.ChannelInfo> getChannels() {
        return service.getChannels();
    }
}