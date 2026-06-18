package com.hpsqsoft.ctrlropa.tenant;

public final class TenantContextHolder {

    private static final ThreadLocal<CurrentTenantContext> CURRENT = new ThreadLocal<>();

    private TenantContextHolder() {
    }

    public static void set(CurrentTenantContext context) {
        CURRENT.set(context);
    }

    public static CurrentTenantContext get() {
        return CURRENT.get();
    }

    public static void clear() {
        CURRENT.remove();
    }
}
