package com.algerac.service;

import com.algerac.model.User;
import com.itextpdf.kernel.pdf.*;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class PdfGenerationService {
    
    private final ObjectMapper objectMapper;
    private static final String ALGERAC_ADDRESS = "ALGERAC - 17 Rue Abdelkader Rakouba, Hussein dey - Alger - Tél : 044.31.74.23/ Fax:044.31.82.20";
    
    /**
     * Génère un PDF complet basé sur le formulaire FOR 20
     */
    public byte[] generateFor20Pdf(User user) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdfDoc = new PdfDocument(writer);
            Document document = new Document(pdfDoc);
            
            // Configuration de la police
            PdfFont font = PdfFontFactory.createFont("Helvetica");
            PdfFont boldFont = PdfFontFactory.createFont("Helvetica-Bold");
            
            // En-tête
            addHeader(document, boldFont);
            
            // Section 1: Identification
            addIdentificationSection(document, user, font, boldFont);
            
            // Section 2: Contacts
            addContactsSection(document, user, font, boldFont);
            
            // Section 3: Formations académiques
            addFormationsAcademiquesSection(document, user, font, boldFont);
            
            // Section 3bis: Autres formations
            addAutresFormationsSection(document, user, font, boldFont);
            
            // Nouvelle page pour les sections suivantes
            document.add(new Paragraph("\n").setFontSize(8));
            
            // Section 4: Expérience professionnelle
            addExperienceProfessionnelleSection(document, user, font, boldFont);
            
            // Section 5: Évaluations/Audits
            addEvaluationsAuditsSection(document, user, font, boldFont);
            
            // Section 6: Formations dispensées
            addFormationsDispenseesSection(document, user, font, boldFont);
            
            // Section 7: Connaissances linguistiques
            addConnaissancesLinguistiquesSection(document, user, font, boldFont);
            
            // Section 8: Divers
            addDiversSection(document, user, font, boldFont);
            
            // Pied de page
            addFooter(document, font);
            
            document.close();
            
            log.info("PDF FOR 20 généré avec succès pour {} {}", user.getNom(), user.getPrenom());
            return baos.toByteArray();
            
        } catch (Exception e) {
            log.error("Erreur lors de la génération du PDF FOR 20", e);
            throw new RuntimeException("Erreur lors de la génération du PDF", e);
        }
    }
    
    private void addHeader(Document document, PdfFont boldFont) {
        Paragraph header = new Paragraph("CURRICULUM VITAE")
                .setFont(boldFont)
                .setFontSize(16)
                .setTextAlignment(TextAlignment.CENTER)
                .setBold();
        document.add(header);
        
        Paragraph subHeader = new Paragraph("FOR 20 Rév 03/ 27 – 03 – 2014")
                .setFontSize(10)
                .setTextAlignment(TextAlignment.CENTER);
        document.add(subHeader);
        
        Paragraph address = new Paragraph(ALGERAC_ADDRESS)
                .setFontSize(8)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(20);
        document.add(address);
    }
    
    private void addIdentificationSection(Document document, User user, PdfFont font, PdfFont boldFont) {
        // Titre de section
        Paragraph sectionTitle = new Paragraph("1 - IDENTIFICATION")
                .setFont(boldFont)
                .setFontSize(12)
                .setBackgroundColor(com.itextpdf.kernel.colors.ColorConstants.LIGHT_GRAY)
                .setPadding(5)
                .setMarginTop(10);
        document.add(sectionTitle);
        
        // Tableau d'identification
        Table table = new Table(UnitValue.createPercentArray(new float[]{25, 50, 25}));
        table.setWidth(UnitValue.createPercentValue(100));
        
        // Ligne 1
        table.addCell(createCell("Nom:", boldFont));
        table.addCell(createCell(user.getNom() + " " + user.getPrenom(), font));
        table.addCell(createCell("Photo", font));
        
        // Ligne 2
        table.addCell(createCell("Date de naissance:", boldFont));
        table.addCell(createCell(user.getDateNaissance() != null ? user.getDateNaissance().toString() : "", font));
        table.addCell(createCell("Nationalité:", boldFont));
        
        // Ligne 3
        table.addCell(createCell("", font));
        table.addCell(createCell(user.getNationalite() != null ? user.getNationalite() : "", font));
        table.addCell(createCell("", font));
        
        // Ligne 4
        table.addCell(createCell("Situation familiale:", boldFont));
        table.addCell(createCell(user.getSituationFamiliale() != null ? user.getSituationFamiliale() : "", font));
        table.addCell(createCell("Date d'élaboration:", boldFont));
        
        // Ligne 5
        table.addCell(createCell("", font));
        table.addCell(createCell("", font));
        table.addCell(createCell(LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")), font));
        
        document.add(table);
    }
    
    private void addContactsSection(Document document, User user, PdfFont font, PdfFont boldFont) {
        Paragraph sectionTitle = new Paragraph("2 - CONTACTS")
                .setFont(boldFont)
                .setFontSize(12)
                .setBackgroundColor(com.itextpdf.kernel.colors.ColorConstants.LIGHT_GRAY)
                .setPadding(5)
                .setMarginTop(10);
        document.add(sectionTitle);
        
        Table table = new Table(UnitValue.createPercentArray(new float[]{30, 70}));
        table.setWidth(UnitValue.createPercentValue(100));
        
        table.addCell(createCell("Domicile:", boldFont));
        table.addCell(createCell(user.getAdresseDomicile() != null ? user.getAdresseDomicile() : "", font));
        
        table.addCell(createCell("Entreprise:", boldFont));
        table.addCell(createCell(user.getAdresseEntreprise() != null ? user.getAdresseEntreprise() : "", font));
        
        table.addCell(createCell("Téléphone:", boldFont));
        table.addCell(createCell(user.getPhone() != null ? user.getPhone() : "", font));
        
        table.addCell(createCell("Téléphone mobile:", boldFont));
        table.addCell(createCell(user.getTelephoneMobile() != null ? user.getTelephoneMobile() : "", font));
        
        table.addCell(createCell("Fax:", boldFont));
        table.addCell(createCell(user.getFax() != null ? user.getFax() : "", font));
        
        table.addCell(createCell("E-mail:", boldFont));
        table.addCell(createCell(user.getEmail() != null ? user.getEmail() : "", font));
        
        // Contact d'urgence
        document.add(table);
        
        Paragraph urgenceTitle = new Paragraph("Contact d'urgence:")
                .setFont(boldFont)
                .setFontSize(10)
                .setMarginTop(10);
        document.add(urgenceTitle);
        
        Table urgenceTable = new Table(UnitValue.createPercentArray(new float[]{30, 70}));
        urgenceTable.setWidth(UnitValue.createPercentValue(100));
        
        urgenceTable.addCell(createCell("Nom:", boldFont));
        urgenceTable.addCell(createCell(user.getContactUrgenceNom() != null ? user.getContactUrgenceNom() : "", font));
        
        urgenceTable.addCell(createCell("Téléphone:", boldFont));
        urgenceTable.addCell(createCell(user.getContactUrgenceTelephone() != null ? user.getContactUrgenceTelephone() : "", font));
        
        urgenceTable.addCell(createCell("Mobile:", boldFont));
        urgenceTable.addCell(createCell(user.getContactUrgenceMobile() != null ? user.getContactUrgenceMobile() : "", font));
        
        document.add(urgenceTable);
    }
    
    @SuppressWarnings("unchecked")
    private void addFormationsAcademiquesSection(Document document, User user, PdfFont font, PdfFont boldFont) {
        Paragraph sectionTitle = new Paragraph("3 - FORMATION ACADÉMIQUE")
                .setFont(boldFont)
                .setFontSize(12)
                .setBackgroundColor(com.itextpdf.kernel.colors.ColorConstants.LIGHT_GRAY)
                .setPadding(5)
                .setMarginTop(10);
        document.add(sectionTitle);
        
        try {
            if (user.getFormationsAcademiquesJson() != null && !user.getFormationsAcademiquesJson().isEmpty()) {
                List<Map<String, Object>> formations = objectMapper.readValue(
                    user.getFormationsAcademiquesJson(), 
                    new TypeReference<List<Map<String, Object>>>() {}
                );
                
                for (Map<String, Object> formation : formations) {
                    Table table = new Table(UnitValue.createPercentArray(new float[]{30, 70}));
                    table.setWidth(UnitValue.createPercentValue(100));
                    table.setMarginBottom(10);
                    
                    table.addCell(createCell("Diplôme:", boldFont));
                    table.addCell(createCell(String.valueOf(formation.get("diplome")), font));
                    
                    table.addCell(createCell("Université:", boldFont));
                    table.addCell(createCell(String.valueOf(formation.get("universite")), font));
                    
                    table.addCell(createCell("Spécialité:", boldFont));
                    table.addCell(createCell(String.valueOf(formation.get("specialite")), font));
                    
                    table.addCell(createCell("Date de fin:", boldFont));
                    table.addCell(createCell(String.valueOf(formation.get("dateFin")), font));
                    
                    document.add(table);
                }
            }
        } catch (Exception e) {
            log.error("Erreur lors du parsing des formations académiques", e);
        }
    }
    
    @SuppressWarnings("unchecked")
    private void addAutresFormationsSection(Document document, User user, PdfFont font, PdfFont boldFont) {
        Paragraph sectionTitle = new Paragraph("3 BIS - AUTRES FORMATIONS")
                .setFont(boldFont)
                .setFontSize(12)
                .setBackgroundColor(com.itextpdf.kernel.colors.ColorConstants.LIGHT_GRAY)
                .setPadding(5)
                .setMarginTop(10);
        document.add(sectionTitle);
        
        try {
            if (user.getAutresFormationsJson() != null && !user.getAutresFormationsJson().isEmpty()) {
                List<Map<String, Object>> formations = objectMapper.readValue(
                    user.getAutresFormationsJson(), 
                    new TypeReference<List<Map<String, Object>>>() {}
                );
                
                Table table = new Table(UnitValue.createPercentArray(new float[]{30, 40, 30}));
                table.setWidth(UnitValue.createPercentValue(100));
                
                // En-tête
                table.addHeaderCell(createCell("Date & Durée", boldFont));
                table.addHeaderCell(createCell("Formation", boldFont));
                table.addHeaderCell(createCell("Organisme", boldFont));
                
                for (Map<String, Object> formation : formations) {
                    table.addCell(createCell(formation.get("dateDebut") + " (" + formation.get("duree") + ")", font));
                    table.addCell(createCell(String.valueOf(formation.get("intituleFormation")), font));
                    table.addCell(createCell(String.valueOf(formation.get("organisme")), font));
                }
                
                document.add(table);
            }
        } catch (Exception e) {
            log.error("Erreur lors du parsing des autres formations", e);
        }
    }
    
    @SuppressWarnings("unchecked")
    private void addExperienceProfessionnelleSection(Document document, User user, PdfFont font, PdfFont boldFont) {
        Paragraph sectionTitle = new Paragraph("4 - EXPÉRIENCE PROFESSIONNELLE")
                .setFont(boldFont)
                .setFontSize(12)
                .setBackgroundColor(com.itextpdf.kernel.colors.ColorConstants.LIGHT_GRAY)
                .setPadding(5)
                .setMarginTop(10);
        document.add(sectionTitle);
        
        try {
            if (user.getExperiencesProfessionnellesJson() != null && !user.getExperiencesProfessionnellesJson().isEmpty()) {
                List<Map<String, Object>> experiences = objectMapper.readValue(
                    user.getExperiencesProfessionnellesJson(), 
                    new TypeReference<List<Map<String, Object>>>() {}
                );
                
                for (Map<String, Object> exp : experiences) {
                    Table table = new Table(UnitValue.createPercentArray(new float[]{30, 70}));
                    table.setWidth(UnitValue.createPercentValue(100));
                    table.setMarginBottom(10);
                    
                    table.addCell(createCell("Date (du - au):", boldFont));
                    table.addCell(createCell(exp.get("dateDebut") + " - " + exp.get("dateFin"), font));
                    
                    table.addCell(createCell("Organisme:", boldFont));
                    table.addCell(createCell(String.valueOf(exp.get("organisme")), font));
                    
                    table.addCell(createCell("Poste occupé:", boldFont));
                    table.addCell(createCell(String.valueOf(exp.get("poste")), font));
                    
                    table.addCell(createCell("Activités principales:", boldFont));
                    table.addCell(createCell(String.valueOf(exp.get("activitesPrincipales")), font));
                    
                    table.addCell(createCell("Domaine de compétence:", boldFont));
                    table.addCell(createCell(String.valueOf(exp.get("domaineCompetence")), font));
                    
                    if (exp.containsKey("sousDomaineCompetence") && exp.get("sousDomaineCompetence") != null) {
                        table.addCell(createCell("Sous-domaine:", boldFont));
                        table.addCell(createCell(String.valueOf(exp.get("sousDomaineCompetence")), font));
                    }
                    
                    document.add(table);
                }
            }
        } catch (Exception e) {
            log.error("Erreur lors du parsing des expériences professionnelles", e);
        }
    }
    
    @SuppressWarnings("unchecked")
    private void addEvaluationsAuditsSection(Document document, User user, PdfFont font, PdfFont boldFont) {
        Paragraph sectionTitle = new Paragraph("5 - ÉVALUATION OU AUDIT DE SM RÉALISÉS")
                .setFont(boldFont)
                .setFontSize(12)
                .setBackgroundColor(com.itextpdf.kernel.colors.ColorConstants.LIGHT_GRAY)
                .setPadding(5)
                .setMarginTop(10);
        document.add(sectionTitle);
        
        try {
            if (user.getEvaluationsAuditsJson() != null && !user.getEvaluationsAuditsJson().isEmpty()) {
                List<Map<String, Object>> evaluations = objectMapper.readValue(
                    user.getEvaluationsAuditsJson(), 
                    new TypeReference<List<Map<String, Object>>>() {}
                );
                
                Table table = new Table(UnitValue.createPercentArray(new float[]{15, 25, 25, 35}));
                table.setWidth(UnitValue.createPercentValue(100));
                
                // En-tête
                table.addHeaderCell(createCell("Mois/Année", boldFont));
                table.addHeaderCell(createCell("Type d'évaluation", boldFont));
                table.addHeaderCell(createCell("Rôle tenu", boldFont));
                table.addHeaderCell(createCell("Normes référentiels", boldFont));
                
                for (Map<String, Object> eval : evaluations) {
                    table.addCell(createCell(String.valueOf(eval.get("moisAnnee")), font));
                    table.addCell(createCell(String.valueOf(eval.get("typeEvaluation")), font));
                    table.addCell(createCell(String.valueOf(eval.get("roleTenu")), font));
                    table.addCell(createCell(String.valueOf(eval.get("normesReferentiels")), font));
                }
                
                document.add(table);
            }
        } catch (Exception e) {
            log.error("Erreur lors du parsing des évaluations/audits", e);
        }
    }
    
    @SuppressWarnings("unchecked")
    private void addFormationsDispenseesSection(Document document, User user, PdfFont font, PdfFont boldFont) {
        Paragraph sectionTitle = new Paragraph("6 - FORMATIONS DISPENSÉES")
                .setFont(boldFont)
                .setFontSize(12)
                .setBackgroundColor(com.itextpdf.kernel.colors.ColorConstants.LIGHT_GRAY)
                .setPadding(5)
                .setMarginTop(10);
        document.add(sectionTitle);
        
        try {
            if (user.getFormationsDispenseesJson() != null && !user.getFormationsDispenseesJson().isEmpty()) {
                List<Map<String, Object>> formations = objectMapper.readValue(
                    user.getFormationsDispenseesJson(), 
                    new TypeReference<List<Map<String, Object>>>() {}
                );
                
                Table table = new Table(UnitValue.createPercentArray(new float[]{30, 70}));
                table.setWidth(UnitValue.createPercentValue(100));
                
                // En-tête
                table.addHeaderCell(createCell("Date & Durée", boldFont));
                table.addHeaderCell(createCell("Formation", boldFont));
                
                for (Map<String, Object> formation : formations) {
                    table.addCell(createCell(formation.get("dateDebut") + " (" + formation.get("duree") + ")", font));
                    table.addCell(createCell(String.valueOf(formation.get("intituleFormation")), font));
                }
                
                document.add(table);
            }
        } catch (Exception e) {
            log.error("Erreur lors du parsing des formations dispensées", e);
        }
    }
    
    @SuppressWarnings("unchecked")
    private void addConnaissancesLinguistiquesSection(Document document, User user, PdfFont font, PdfFont boldFont) {
        Paragraph sectionTitle = new Paragraph("7 - CONNAISSANCE LINGUISTIQUE")
                .setFont(boldFont)
                .setFontSize(12)
                .setBackgroundColor(com.itextpdf.kernel.colors.ColorConstants.LIGHT_GRAY)
                .setPadding(5)
                .setMarginTop(10);
        document.add(sectionTitle);
        
        Paragraph note = new Paragraph("1 = Basique | 2 = Bien | 3 = Très bien | 4 = Excellent")
                .setFontSize(8)
                .setItalic()
                .setMarginBottom(5);
        document.add(note);
        
        try {
            if (user.getConnaissancesLinguistiquesJson() != null && !user.getConnaissancesLinguistiquesJson().isEmpty()) {
                List<Map<String, Object>> langues = objectMapper.readValue(
                    user.getConnaissancesLinguistiquesJson(), 
                    new TypeReference<List<Map<String, Object>>>() {}
                );
                
                Table table = new Table(UnitValue.createPercentArray(new float[]{25, 25, 25, 25}));
                table.setWidth(UnitValue.createPercentValue(100));
                
                // En-tête
                table.addHeaderCell(createCell("Langues", boldFont));
                table.addHeaderCell(createCell("Lu", boldFont));
                table.addHeaderCell(createCell("Parlé", boldFont));
                table.addHeaderCell(createCell("Écrit", boldFont));
                
                for (Map<String, Object> langue : langues) {
                    table.addCell(createCell(String.valueOf(langue.get("langue")), font));
                    table.addCell(createCell(String.valueOf(langue.get("niveauLu")), font));
                    table.addCell(createCell(String.valueOf(langue.get("niveauParle")), font));
                    table.addCell(createCell(String.valueOf(langue.get("niveauEcrit")), font));
                }
                
                document.add(table);
            }
        } catch (Exception e) {
            log.error("Erreur lors du parsing des connaissances linguistiques", e);
        }
    }
    
    private void addDiversSection(Document document, User user, PdfFont font, PdfFont boldFont) {
        Paragraph sectionTitle = new Paragraph("8 - DIVERS")
                .setFont(boldFont)
                .setFontSize(12)
                .setBackgroundColor(com.itextpdf.kernel.colors.ColorConstants.LIGHT_GRAY)
                .setPadding(5)
                .setMarginTop(10);
        document.add(sectionTitle);
        
        Paragraph divers = new Paragraph(user.getInformationsComplementaires() != null ? user.getInformationsComplementaires() : "")
                .setFont(font)
                .setFontSize(10)
                .setMarginTop(5);
        document.add(divers);
        
        // Ajout du domaine d'expertise
        if (user.getDomaineExpertise() != null) {
            Paragraph domaine = new Paragraph("Domaine d'expertise : " + user.getDomaineExpertise())
                    .setFont(boldFont)
                    .setFontSize(10)
                    .setMarginTop(10);
            document.add(domaine);
        }
        
        if (user.getSousDomaineExpertise() != null && !user.getSousDomaineExpertise().isEmpty()) {
            Paragraph sousDomaine = new Paragraph("Sous-domaine : " + user.getSousDomaineExpertise())
                    .setFont(font)
                    .setFontSize(10);
            document.add(sousDomaine);
        }
    }
    
    private void addFooter(Document document, PdfFont font) {
        Paragraph footer = new Paragraph("Document généré le " + 
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm")))
                .setFont(font)
                .setFontSize(8)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginTop(20);
        document.add(footer);
    }
    
    private Cell createCell(String content, PdfFont font) {
        return new Cell()
                .add(new Paragraph(content != null ? content : "").setFont(font).setFontSize(9))
                .setPadding(5);
    }
}