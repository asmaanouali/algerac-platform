package com.algerac.repository;

import com.algerac.model.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    
    // CHANGED: findByRequestId → findByRequest_Id
    List<Document> findByRequest_Id(Long requestId);
    
    // CHANGED: findByUploaderId → findByUploader_Id
    List<Document> findByUploader_Id(Long uploaderId);
}