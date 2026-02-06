package com.algerac.controller;

import com.algerac.dto.AccreditationRequestDTO;
import com.algerac.dto.ApiResponse;
import com.algerac.dto.CreateRequestDTO;
import com.algerac.model.AccreditationRequest;
import com.algerac.model.User;
import com.algerac.model.UserRole;
import com.algerac.repository.UserRepository;
import com.algerac.service.RequestService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/requests")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"}, allowCredentials = "true")
public class RequestController {
    
    private final RequestService requestService;
    private final UserRepository userRepository;
    
    @GetMapping
    public ResponseEntity<?> listRequests(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        
        List<AccreditationRequest> requests;
        
        if (user.getRole() == UserRole.OEC) {
            requests = requestService.getRequestsByOec(user.getId());
        } else {
            // Admin/RA see all
            requests = requestService.getAllRequests();
        }
        
        List<AccreditationRequestDTO> dtos = requests.stream()
                .map(AccreditationRequestDTO::fromRequest)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(dtos);
    }
    
    @PostMapping
    public ResponseEntity<?> createRequest(
            @Valid @RequestBody CreateRequestDTO dto,
            HttpSession session) {
        
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        
        try {
            AccreditationRequest request = requestService.createRequest(dto, user);
            AccreditationRequestDTO responseDto = AccreditationRequestDTO.fromRequest(request);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(responseDto);
        } catch (RuntimeException e) {
            log.error("Erreur lors de la création de la demande : {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getRequest(@PathVariable Long id, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        AccreditationRequest request = requestService.getRequest(id)
                .orElse(null);
        
        if (request == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Demande non trouvée"));
        }
        
        AccreditationRequestDTO dto = AccreditationRequestDTO.fromRequest(request);
        return ResponseEntity.ok(dto);
    }
}