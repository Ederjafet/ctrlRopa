package com.hpsqsoft.ctrlropa.security.access;

public final class PermissionCode {

    private PermissionCode() {
    }

    public static final String MANAGE_USERS = "MANAGE_USERS";
    public static final String MANAGE_ROLES = "MANAGE_ROLES";
    public static final String MANAGE_BRANCH_CHANNELS = "MANAGE_BRANCH_CHANNELS";
    public static final String MANAGE_BRANCHES = "MANAGE_BRANCHES";
    public static final String MANAGE_CATALOGS = "MANAGE_CATALOGS";
    public static final String MANAGE_SECURITY_SETTINGS = "MANAGE_SECURITY_SETTINGS";
    public static final String VIEW_SECURITY_AUDIT = "VIEW_SECURITY_AUDIT";

    public static final String VIEW_CUSTOMERS = "VIEW_CUSTOMERS";
    public static final String CREATE_CUSTOMER = "CREATE_CUSTOMER";
    public static final String EDIT_CUSTOMER = "EDIT_CUSTOMER";
    public static final String VIEW_CUSTOMER_ORDERS = "VIEW_CUSTOMER_ORDERS";
    public static final String VIEW_INVENTORY = "VIEW_INVENTORY";
    public static final String MANAGE_INVENTORY = "MANAGE_INVENTORY";

    public static final String VIEW_LIVE = "VIEW_LIVE";
    public static final String OPERATE_LIVE = "OPERATE_LIVE";
    public static final String PREPARE_LIVE_ITEM = "PREPARE_LIVE_ITEM";
    public static final String CHANGE_LIVE_ACTIVE_ITEM = "CHANGE_LIVE_ACTIVE_ITEM";
    public static final String REMOVE_LIVE_ACTIVE_ITEM = "REMOVE_LIVE_ACTIVE_ITEM";
    public static final String DO_LIVE_RESERVATION = "DO_LIVE_RESERVATION";
    public static final String REQUEST_LIVE_OPERATION_AUTHORIZATION = "REQUEST_LIVE_OPERATION_AUTHORIZATION";
    public static final String APPROVE_LIVE_OPERATION_AUTHORIZATION = "APPROVE_LIVE_OPERATION_AUTHORIZATION";
    public static final String VIEW_LIVE_OPERATION_AUTHORIZATIONS = "VIEW_LIVE_OPERATION_AUTHORIZATIONS";
    public static final String APPLY_LIVE_OPERATION_AUTHORIZATION = "APPLY_LIVE_OPERATION_AUTHORIZATION";
    public static final String CANCEL_RESERVATION_WITH_PAYMENT = "CANCEL_RESERVATION_WITH_PAYMENT";
    public static final String RELEASE_RESERVED_ITEM = "RELEASE_RESERVED_ITEM";
    public static final String UNDO_LIVE_OPERATIONAL_SALE = "UNDO_LIVE_OPERATIONAL_SALE";
    public static final String REASSIGN_RESERVATION = "REASSIGN_RESERVATION";
    public static final String EDIT_LOCKED_ITEM = "EDIT_LOCKED_ITEM";
    public static final String DO_DOOR_SALE = "DO_DOOR_SALE";
    public static final String DO_DOOR_RESERVATION = "DO_DOOR_RESERVATION";

    public static final String VIEW_PAYMENTS = "VIEW_PAYMENTS";
    public static final String REGISTER_PAYMENTS = "REGISTER_PAYMENTS";
    public static final String APPLY_CUSTOMER_BALANCE = "APPLY_CUSTOMER_BALANCE";
    public static final String VOID_PAYMENT = "VOID_PAYMENT";

    public static final String CREATE_CLOSE_CUSTOMER_PACKAGE = "CREATE_CLOSE_CUSTOMER_PACKAGE";
    public static final String MANAGE_SHIPMENTS = "MANAGE_SHIPMENTS";

    public static final String CANCEL_RESERVATION = "CANCEL_RESERVATION";
    public static final String VIEW_SALES = "VIEW_SALES";
    public static final String CANCEL_SALE = "CANCEL_SALE";

    public static final String REQUEST_REFUND = "REQUEST_REFUND";
    public static final String APPROVE_REFUND = "APPROVE_REFUND";
    public static final String PROCESS_REFUND = "PROCESS_REFUND";
    public static final String CANCEL_REFUND = "CANCEL_REFUND";
    public static final String MANAGE_REFUNDS = "MANAGE_REFUNDS";
    public static final String MANAGE_RETURNS = "MANAGE_RETURNS";

    public static final String REASSIGN_CUSTOMERS = "REASSIGN_CUSTOMERS";
    public static final String MANAGE_BRANDING = "MANAGE_BRANDING";

    public static final String MANAGE_TRANSFERS = "MANAGE_TRANSFERS";
    public static final String SEND_TRANSFERS = "SEND_TRANSFERS";
    public static final String RECEIVE_TRANSFERS = "RECEIVE_TRANSFERS";
    public static final String CANCEL_TRANSFERS = "CANCEL_TRANSFERS";

    public static final String MANAGE_CONSIGNMENTS = "MANAGE_CONSIGNMENTS";
    public static final String SETTLE_CONSIGNMENTS = "SETTLE_CONSIGNMENTS";
    public static final String CANCEL_CONSIGNMENTS = "CANCEL_CONSIGNMENTS";
    
    public static final String VIEW_REPORTS = "VIEW_REPORTS";
    
    public static final String MANAGE_CASH_CLOSURES = "MANAGE_CASH_CLOSURES";
    public static final String MANAGE_INCIDENTS = "MANAGE_INCIDENTS";
}
