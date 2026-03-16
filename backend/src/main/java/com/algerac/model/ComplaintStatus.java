package com.algerac.model;

public enum ComplaintStatus {
    RECEIVED,               // Just received, not yet reviewed
    UNDER_REVIEW,           // RQ is reviewing
    ASSIGNED,               // Assigned to investigator
    INVESTIGATION,          // Under investigation
    FOUNDED,                // Complaint is founded - corrective actions needed
    UNFOUNDED,              // Complaint is not founded
    CORRECTIVE_ACTIONS,     // Corrective actions in progress
    RESOLVED,               // Corrective actions completed
    APPEALED,               // OEC/complainant has appealed the decision
    APPEAL_UNDER_REVIEW,    // Appeal under review by Commission d'Appel (GEN_04)
    APPEAL_DECISION,        // Appeal decision rendered
    ESCALATED_TO_DG,        // Escalated to Direction Générale
    CLOSED                  // Case closed
}
