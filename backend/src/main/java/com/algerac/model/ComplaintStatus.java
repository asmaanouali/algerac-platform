package com.algerac.model;

public enum ComplaintStatus {
    RECEIVED,       // Just received, not yet reviewed
    UNDER_REVIEW,   // RQ is reviewing
    INVESTIGATION,  // Under investigation
    FOUNDED,        // Complaint is founded - corrective actions needed
    UNFOUNDED,      // Complaint is not founded
    RESOLVED,       // Corrective actions completed
    CLOSED          // Case closed
}
