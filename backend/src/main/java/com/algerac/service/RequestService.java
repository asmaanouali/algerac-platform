package com.algerac.service;

import com.algerac.dto.CreateRequestDTO;
import com.algerac.model.AccreditationRequest;
import com.algerac.model.RequestStatus;
import com.algerac.model.User;
import com.algerac.repository.RequestRepository;
import com.algerac.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class RequestService {
    
    private final RequestRepository requestRepository;
    private final UserRepository userRepository;
    
    public List<AccreditationRequest> getAllRequests() {
        return requestRepository.findAll();
    }
    
    public List<AccreditationRequest> getRequestsByOec(Long oecId) {
        return requestRepository.findByOec_Id(oecId);
    }
    
    public Optional<AccreditationRequest> getRequest(Long id) {
        return requestRepository.findById(id);
    }
    
    @Transactional
    public AccreditationRequest createRequest(CreateRequestDTO dto, User currentUser) {
        // Determine OEC
        Long oecId = dto.getOecId() != null ? dto.getOecId() : currentUser.getId();
        User oec = userRepository.findById(oecId)
                .orElseThrow(() -> new RuntimeException("OEC non trouvé"));
        
        // Generate reference number
        String referenceNumber = generateReferenceNumber();
        
        AccreditationRequest request = AccreditationRequest.builder()
                .referenceNumber(referenceNumber)
                .oec(oec)
                .type(dto.getType())
                .domain(dto.getDomain())
                .status(dto.getStatus() != null ? dto.getStatus() : RequestStatus.DRAFT)
                .progress(dto.getProgress() != null ? dto.getProgress() : 0)
                .createdAt(LocalDateTime.now())
                .build();
        
        request = requestRepository.save(request);
        log.info("Nouvelle demande créée : {}", request.getReferenceNumber());
        
        return request;
    }
    
    private String generateReferenceNumber() {
        String year = String.valueOf(Year.now().getValue());
        int counter = 1;
        String refNumber;
        
        do {
            refNumber = String.format("D-%s-%03d", year, counter);
            counter++;
        } while (requestRepository.existsByReferenceNumber(refNumber));
        
        return refNumber;
    }
    
    @Transactional
    public AccreditationRequest updateRequest(Long id, AccreditationRequest updates) {
        AccreditationRequest request = requestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        
        if (updates.getStatus() != null) {
            request.setStatus(updates.getStatus());
        }
        if (updates.getProgress() != null) {
            request.setProgress(updates.getProgress());
        }
        if (updates.getSubmissionDate() != null) {
            request.setSubmissionDate(updates.getSubmissionDate());
        }
        if (updates.getNextActionDate() != null) {
            request.setNextActionDate(updates.getNextActionDate());
        }
        
        return requestRepository.save(request);
    }
}