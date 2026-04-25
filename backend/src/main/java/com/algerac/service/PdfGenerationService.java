package com.algerac.service;

import com.algerac.model.AccreditationRequest;
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
        
        // Tableau d'identification (2 colonnes: label et valeur)
        Table table = new Table(UnitValue.createPercentArray(new float[]{35, 65}));
        table.setWidth(UnitValue.createPercentValue(100));
        
        table.addCell(createCell("ID d'inscription:", boldFont));
        table.addCell(createCell(user.getRegistrationId() != null ? user.getRegistrationId() : "", font));
        
        table.addCell(createCell("Nom:", boldFont));
        table.addCell(createCell(user.getNom() != null ? user.getNom() : "", font));
        
        table.addCell(createCell("Prénom:", boldFont));
        table.addCell(createCell(user.getPrenom() != null ? user.getPrenom() : "", font));
        
        table.addCell(createCell("Date de naissance:", boldFont));
        table.addCell(createCell(user.getDateNaissance() != null ? user.getDateNaissance().toString() : "", font));
        
        table.addCell(createCell("Nationalité:", boldFont));
        table.addCell(createCell(user.getNationalite() != null ? user.getNationalite() : "", font));
        
        table.addCell(createCell("Situation familiale:", boldFont));
        table.addCell(createCell(user.getSituationFamiliale() != null ? user.getSituationFamiliale() : "", font));
        
        table.addCell(createCell("Date d'élaboration:", boldFont));
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
                    
                    String dateDebut = formation.get("dateDebut") != null ? String.valueOf(formation.get("dateDebut")) : "";
                    String dateFin = formation.get("dateFin") != null ? String.valueOf(formation.get("dateFin")) : "";
                    String dateDisplay = !dateDebut.isEmpty() && !"null".equals(dateDebut) ? dateDebut : "";
                    if (!dateFin.isEmpty() && !"null".equals(dateFin)) {
                        dateDisplay = dateDisplay + " - " + dateFin;
                    }
                    
                    table.addCell(createCell("Date début - Date fin:", boldFont));
                    table.addCell(createCell(dateDisplay, font));
                    
                    table.addCell(createCell("Université / Institution:", boldFont));
                    table.addCell(createCell(String.valueOf(formation.get("universite")), font));
                    
                    table.addCell(createCell("Cours / Spécialité:", boldFont));
                    String cours = formation.get("cours") != null ? String.valueOf(formation.get("cours")) : "";
                    String specialite = formation.get("specialite") != null ? String.valueOf(formation.get("specialite")) : "";
                    table.addCell(createCell(!cours.isEmpty() && !"null".equals(cours) ? cours : specialite, font));
                    
                    table.addCell(createCell("Diplôme:", boldFont));
                    table.addCell(createCell(String.valueOf(formation.get("diplome")), font));
                    
                    document.add(table);
                }
            }
        } catch (Exception e) {
            log.error("Erreur lors du parsing des formations académiques", e);
        }
    }
    
    private void addAutresFormationsSection(Document document, User user, PdfFont font, PdfFont boldFont) {
        Paragraph sectionTitle = new Paragraph("4 - AUTRES FORMATIONS")
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
                
                for (Map<String, Object> formation : formations) {
                    Table table = new Table(UnitValue.createPercentArray(new float[]{30, 70}));
                    table.setWidth(UnitValue.createPercentValue(100));
                    table.setMarginBottom(10);
                    
                    String dateDebut = formation.get("dateDebut") != null ? String.valueOf(formation.get("dateDebut")) : "";
                    String dateFin = formation.get("dateFin") != null ? String.valueOf(formation.get("dateFin")) : "";
                    String dateDisplay = (!dateDebut.isEmpty() && !"null".equals(dateDebut) ? dateDebut : "");
                    if (!dateFin.isEmpty() && !"null".equals(dateFin)) {
                        dateDisplay = dateDisplay + " - " + dateFin;
                    }
                    
                    table.addCell(createCell("Date début - Date fin:", boldFont));
                    table.addCell(createCell(dateDisplay, font));
                    
                    table.addCell(createCell("Institution / Organisme:", boldFont));
                    String institution = formation.get("institution") != null ? String.valueOf(formation.get("institution")) : "";
                    table.addCell(createCell(!"null".equals(institution) ? institution : "", font));
                    
                    table.addCell(createCell("Cours / Spécialité:", boldFont));
                    String cours = formation.get("cours") != null ? String.valueOf(formation.get("cours")) : "";
                    String specialite = formation.get("specialite") != null ? String.valueOf(formation.get("specialite")) : "";
                    table.addCell(createCell(!cours.isEmpty() && !"null".equals(cours) ? cours : specialite, font));
                    
                    table.addCell(createCell("Certificat / Diplôme:", boldFont));
                    String certificat = formation.get("certificat") != null ? String.valueOf(formation.get("certificat")) : "";
                    table.addCell(createCell(!"null".equals(certificat) ? certificat : "", font));
                    
                    document.add(table);
                }
            }
        } catch (Exception e) {
            log.error("Erreur lors du parsing des autres formations", e);
        }
    }
    
    private void addExperienceProfessionnelleSection(Document document, User user, PdfFont font, PdfFont boldFont) {
        Paragraph sectionTitle = new Paragraph("5 - EXPÉRIENCE PROFESSIONNELLE")
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
    
    private void addEvaluationsAuditsSection(Document document, User user, PdfFont font, PdfFont boldFont) {
        Paragraph sectionTitle = new Paragraph("6 - ÉVALUATIONS / AUDITS RÉALISÉS")
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
                
                Table table = new Table(UnitValue.createPercentArray(new float[]{10, 15, 20, 20, 35}));
                table.setWidth(UnitValue.createPercentValue(100));
                
                // En-tête
                table.addHeaderCell(createCell("Type", boldFont));
                table.addHeaderCell(createCell("Période", boldFont));
                table.addHeaderCell(createCell("Type d'évaluation", boldFont));
                table.addHeaderCell(createCell("Rôle tenu", boldFont));
                table.addHeaderCell(createCell("Normes référentiels", boldFont));
                
                for (Map<String, Object> eval : evaluations) {
                    String type = eval.get("type") != null ? String.valueOf(eval.get("type")) : "";
                    String typeLabel = "evaluation".equals(type) ? "Évaluation" : "audit".equals(type) ? "Audit" : type;
                    table.addCell(createCell(typeLabel, font));
                    String dateDebut = eval.get("dateDebut") != null ? String.valueOf(eval.get("dateDebut")) : "";
                    String dateFin = eval.get("dateFin") != null ? String.valueOf(eval.get("dateFin")) : "";
                    String periode = !"null".equals(dateDebut) ? dateDebut : "";
                    if (!dateFin.isEmpty() && !"null".equals(dateFin)) {
                        periode = periode + " - " + dateFin;
                    }
                    table.addCell(createCell(periode, font));
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
    
    private void addFormationsDispenseesSection(Document document, User user, PdfFont font, PdfFont boldFont) {
        Paragraph sectionTitle = new Paragraph("7 - FORMATIONS DISPENSÉES")
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
                
                Table table = new Table(UnitValue.createPercentArray(new float[]{20, 10, 40, 30}));
                table.setWidth(UnitValue.createPercentValue(100));
                
                // En-tête
                table.addHeaderCell(createCell("Période", boldFont));
                table.addHeaderCell(createCell("Durée", boldFont));
                table.addHeaderCell(createCell("Formation", boldFont));
                table.addHeaderCell(createCell("Organisme bénéficiaire", boldFont));
                
                for (Map<String, Object> formation : formations) {
                    String dateDebut = formation.get("dateDebut") != null ? String.valueOf(formation.get("dateDebut")) : "";
                    String dateFin = formation.get("dateFin") != null ? String.valueOf(formation.get("dateFin")) : "";
                    String periode = !dateDebut.isEmpty() && !"null".equals(dateDebut) ? dateDebut : "";
                    if (!dateFin.isEmpty() && !"null".equals(dateFin)) {
                        periode = periode + " - " + dateFin;
                    }
                    table.addCell(createCell(periode, font));
                    String duree = formation.get("duree") != null ? String.valueOf(formation.get("duree")) : "";
                    table.addCell(createCell(!"null".equals(duree) ? duree : "", font));
                    table.addCell(createCell(String.valueOf(formation.get("intituleFormation")), font));
                    String organisme = formation.get("organismeBeneficiaire") != null ? String.valueOf(formation.get("organismeBeneficiaire")) : "";
                    table.addCell(createCell(!"null".equals(organisme) ? organisme : "", font));
                }
                
                document.add(table);
            }
        } catch (Exception e) {
            log.error("Erreur lors du parsing des formations dispensées", e);
        }
    }
    
    private void addConnaissancesLinguistiquesSection(Document document, User user, PdfFont font, PdfFont boldFont) {
        Paragraph sectionTitle = new Paragraph("8 - CONNAISSANCE LINGUISTIQUE")
                .setFont(boldFont)
                .setFontSize(12)
                .setBackgroundColor(com.itextpdf.kernel.colors.ColorConstants.LIGHT_GRAY)
                .setPadding(5)
                .setMarginTop(10);
        document.add(sectionTitle);
        
        Paragraph note = new Paragraph("Niveaux : Basique | Assez bien | Bien | Très bien | Excellent")
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
        Paragraph sectionTitle = new Paragraph("9 - DIVERS")
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
    
    /**
     * Génère un PDF DOC1 pour les OEC (Organismes d'Évaluation de la Conformité)
     */
    public byte[] generateDoc1Pdf(User user) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdfDoc = new PdfDocument(writer);
            Document document = new Document(pdfDoc);
            
            // Configuration de la police
            PdfFont font = PdfFontFactory.createFont("Helvetica");
            PdfFont boldFont = PdfFontFactory.createFont("Helvetica-Bold");
            
            // En-tête du document
            addDoc1Header(document, boldFont);
            
            // Informations de l'organisme
            addOrganismeInfoSection(document, user, font, boldFont);
            
            // Représentant légal
            addRepresentantInfoSection(document, user, font, boldFont);
            
            // Portée d'accréditation
            addPorteeAccreditationSection(document, user, font, boldFont);
            
            // Pied de page
            addFooter(document, font);
            
            document.close();
            
            log.info("PDF DOC1 généré avec succès pour {}", user.getOrganizationName());
            return baos.toByteArray();
            
        } catch (Exception e) {
            log.error("Erreur lors de la génération du PDF DOC1", e);
            throw new RuntimeException("Erreur lors de la génération du PDF DOC1", e);
        }
    }
    
    private void addDoc1Header(Document document, PdfFont boldFont) {
        // Logo/Titre ALGERAC
        Paragraph logo = new Paragraph("ALGERAC")
                .setFont(boldFont)
                .setFontSize(18)
                .setTextAlignment(TextAlignment.CENTER)
                .setBold();
        document.add(logo);
        
        Paragraph subtitle = new Paragraph("Association Algérienne pour l'Accréditation")
                .setFont(boldFont)
                .setFontSize(12)
                .setTextAlignment(TextAlignment.CENTER);
        document.add(subtitle);
        
        document.add(new Paragraph("\n"));
        
        // Titre du document
        Paragraph title = new Paragraph("DOC 1 - DEMANDE D'ACCRÉDITATION")
                .setFont(boldFont)
                .setFontSize(16)
                .setTextAlignment(TextAlignment.CENTER)
                .setBold();
        document.add(title);
        
        Paragraph subtitle2 = new Paragraph("Organisme d'Évaluation de la Conformité")
                .setFont(boldFont)
                .setFontSize(12)
                .setTextAlignment(TextAlignment.CENTER);
        document.add(subtitle2);
        
        document.add(new Paragraph("\n\n"));
    }
    
    private void addOrganismeInfoSection(Document document, User user, PdfFont font, PdfFont boldFont) {
        Paragraph sectionTitle = new Paragraph("INFORMATIONS SUR L'ORGANISME")
                .setFont(boldFont)
                .setFontSize(14)
                .setBold();
        document.add(sectionTitle);
        
        document.add(new Paragraph("\n"));
        
        // Tableau des informations de l'organisme
        Table table = new Table(UnitValue.createPercentArray(new float[]{30, 70}))
                .useAllAvailableWidth();
        
        table.addCell(createCell("Nom de l'organisme :", boldFont));
        table.addCell(createCell(user.getOrganizationName() != null ? user.getOrganizationName() : "", font));
        
        table.addCell(createCell("Type d'organisme :", boldFont));
        table.addCell(createCell(user.getTypeOrganisme() != null ? user.getTypeOrganisme() : "", font));
        
        table.addCell(createCell("Adresse du siège :", boldFont));
        table.addCell(createCell(user.getAdresseSiege() != null ? user.getAdresseSiege() : "", font));
        
        table.addCell(createCell("Téléphone :", boldFont));
        table.addCell(createCell(user.getPhone() != null ? user.getPhone() : "", font));
        
        table.addCell(createCell("Email :", boldFont));
        table.addCell(createCell(user.getEmail() != null ? user.getEmail() : "", font));
        
        document.add(table);
        document.add(new Paragraph("\n\n"));
    }
    
    private void addRepresentantInfoSection(Document document, User user, PdfFont font, PdfFont boldFont) {
        Paragraph sectionTitle = new Paragraph("REPRÉSENTANT LÉGAL")
                .setFont(boldFont)
                .setFontSize(14)
                .setBold();
        document.add(sectionTitle);
        
        document.add(new Paragraph("\n"));
        
        // Tableau des informations du représentant
        Table table = new Table(UnitValue.createPercentArray(new float[]{30, 70}))
                .useAllAvailableWidth();
        
        table.addCell(createCell("Nom du représentant :", boldFont));
        table.addCell(createCell(user.getNomRepresentant() != null ? user.getNomRepresentant() : "", font));
        
        table.addCell(createCell("Fonction :", boldFont));
        table.addCell(createCell(user.getFonction() != null ? user.getFonction() : "", font));
        
        table.addCell(createCell("Téléphone direct :", boldFont));
        table.addCell(createCell(user.getTelephoneDirect() != null ? user.getTelephoneDirect() : "", font));
        
        table.addCell(createCell("Email professionnel :", boldFont));
        table.addCell(createCell(user.getEmailProfessionnel() != null ? user.getEmailProfessionnel() : "", font));
        
        document.add(table);
        document.add(new Paragraph("\n\n"));
    }
    
    private void addPorteeAccreditationSection(Document document, User user, PdfFont font, PdfFont boldFont) {
        Paragraph sectionTitle = new Paragraph("PORTÉE D'ACCRÉDITATION DEMANDÉE")
                .setFont(boldFont)
                .setFontSize(14)
                .setBold();
        document.add(sectionTitle);
        
        document.add(new Paragraph("\n"));
        
        Paragraph portee = new Paragraph(user.getPorteeAccreditation() != null 
                ? user.getPorteeAccreditation() 
                : "Non spécifiée")
                .setFont(font)
                .setFontSize(11);
        document.add(portee);
        
        document.add(new Paragraph("\n\n"));
        
        // Date de la demande
        Paragraph dateDemande = new Paragraph("Date de la demande : " + 
                (user.getCreatedAt() != null 
                    ? user.getCreatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                    : LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))))
                .setFont(font)
                .setFontSize(10);
        document.add(dateDemande);
        
        document.add(new Paragraph("\n"));
        
        // Adresse ALGERAC
        Paragraph address = new Paragraph(ALGERAC_ADDRESS)
                .setFont(font)
                .setFontSize(8)
                .setTextAlignment(TextAlignment.CENTER);
        document.add(address);
    }
    
    /**
     * Generation du PDF DOC1 pour une candidature OEC
     */
    public byte[] generateOECApplicationPdf(com.algerac.model.OECApplication application) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdfDoc = new PdfDocument(writer);
            Document document = new Document(pdfDoc);
            
            PdfFont font = PdfFontFactory.createFont("Helvetica");
            PdfFont boldFont = PdfFontFactory.createFont("Helvetica-Bold");
            
            // En-tete
            Paragraph header = new Paragraph("DEMANDE D'ACCREDITATION OEC")
                    .setFont(boldFont)
                    .setFontSize(18)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setBold();
            document.add(header);
            
            Paragraph subtitle = new Paragraph("Organisme d'evaluation de la Conformite")
                    .setFont(font)
                    .setFontSize(12)
                    .setTextAlignment(TextAlignment.CENTER);
            document.add(subtitle);
            
            document.add(new Paragraph("\n"));
            
            // Informations de base
            Table table = new Table(UnitValue.createPercentArray(new float[]{35, 65}))
                    .useAllAvailableWidth();
            
            table.addCell(createCell("Nom de l'organisme :", boldFont));
            table.addCell(createCell(application.getNomOrganisme(), font));
            
            table.addCell(createCell("Type d'organisme :", boldFont));
            table.addCell(createCell(application.getTypeOrganisme() != null ? application.getTypeOrganisme() : "", font));
            
            table.addCell(createCell("Adresse du siege :", boldFont));
            table.addCell(createCell(application.getAdresseSiege() != null ? application.getAdresseSiege() : "", font));
            
            table.addCell(createCell("Telephone :", boldFont));
            table.addCell(createCell(application.getTelephone() != null ? application.getTelephone() : "", font));
            
            table.addCell(createCell("Email :", boldFont));
            table.addCell(createCell(application.getEmail(), font));
            
            document.add(table);
            document.close();
            
            log.info("PDF DOC1 genere pour la candidature OEC #{}", application.getId());
            return baos.toByteArray();

        } catch (Exception e) {
            log.error("Erreur lors de la generation du PDF DOC1", e);
            throw new RuntimeException("Erreur lors de la generation du PDF DOC1", e);
        }
    }

    // =======================================================================
    // Accreditation request PDFs — used to package DOC1 and the technical form
    // (FOR 04 / FOR 05 depending on activities) so DAG, CD, RA, etc. can read
    // the submitted data offline and archive it with the dossier.
    // =======================================================================

    /**
     * Build the DOC1 PDF for a submitted accreditation request. Reads the
     * description JSON blob saved by the OEC's new-request flow and renders
     * the administrative sections.
     */
    public byte[] generateAccreditationDoc1Pdf(AccreditationRequest request) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);
            PdfFont font = PdfFontFactory.createFont("Helvetica");
            PdfFont bold = PdfFontFactory.createFont("Helvetica-Bold");

            document.add(new Paragraph("ALGERAC — DOC 1").setFont(bold).setFontSize(14).setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph("Demande d'accréditation").setFont(bold).setFontSize(12).setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph(" "));

            String refLabel = request.getReferenceNumber();
            if (refLabel == null || refLabel.isBlank()) {
                refLabel = request.getSequenceNumber() != null ? ("Séq. #" + request.getSequenceNumber()) : ("Dossier #" + request.getId());
            }
            document.add(new Paragraph("Référence : " + refLabel).setFont(bold));
            if (request.getSubmissionDate() != null) {
                document.add(new Paragraph("Date de soumission : " + request.getSubmissionDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))).setFont(font));
            }
            document.add(new Paragraph(" "));

            Map<String, Object> body = parseDescription(request.getDescription());

            Table t = new Table(UnitValue.createPercentArray(new float[]{3f, 7f})).useAllAvailableWidth();
            addDoc1Row(t, "Type de demande", str(body.get("typeDemande")), font, bold);
            addDoc1Row(t, "Type de site", str(body.get("siteType")), font, bold);
            addDoc1Row(t, "Activités", joinList(body.get("activites")), font, bold);
            addDoc1Row(t, "Date d'évaluation souhaitée", str(body.get("dateEvaluation")), font, bold);
            addDoc1Row(t, "Nom légal", str(body.get("nomLegal")), font, bold);
            addDoc1Row(t, "Abréviation", str(body.get("abreviation")), font, bold);
            addDoc1Row(t, "Sigle", str(body.get("sigle")), font, bold);
            addDoc1Row(t, "Statut juridique", str(body.get("statutJuridique")), font, bold);
            addDoc1Row(t, "Registre de commerce", str(body.get("registreCommerce")), font, bold);
            addDoc1Row(t, "Codes d'activité", str(body.get("codesActivite")), font, bold);
            addDoc1Row(t, "Adresse du siège", str(body.get("adresseSiege")), font, bold);
            addDoc1Row(t, "Email organisme", str(body.get("emailOrg")), font, bold);
            addDoc1Row(t, "Site web", str(body.get("siteWeb")), font, bold);
            addDoc1Row(t, "Contact — nom", str(body.get("contactNom")), font, bold);
            addDoc1Row(t, "Contact — fonction", str(body.get("contactFonction")), font, bold);
            addDoc1Row(t, "Contact — téléphone", str(body.get("contactTelephone")), font, bold);
            addDoc1Row(t, "Contact — email", str(body.get("contactEmail")), font, bold);
            addDoc1Row(t, "Responsable qualité", str(body.get("responsableQualiteNom")), font, bold);
            addDoc1Row(t, "Demandeur", str(body.get("demandeurNom")), font, bold);
            addDoc1Row(t, "Fonction demandeur", str(body.get("demandeurFonction")), font, bold);
            addDoc1Row(t, "Date de la demande", str(body.get("demandeurDate")), font, bold);
            document.add(t);

            renderTableIfAny(document, body.get("sites"), "Sites", font, bold);
            renderTableIfAny(document, body.get("personnelSites"), "Personnel par site", font, bold);
            renderTableIfAny(document, body.get("responsablesTechniques"), "Responsables techniques", font, bold);
            renderTableIfAny(document, body.get("reconnaissances"), "Reconnaissances existantes", font, bold);

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Erreur lors de la génération du PDF DOC1 pour la demande #{}", request.getId(), e);
            throw new RuntimeException("Erreur lors de la génération du PDF DOC1 d'accréditation", e);
        }
    }

    /**
     * Build the technical form PDF (FOR 04 for inspection, FOR 05 for essais,
     * FOR 06 for étalonnage, etc.) based on the activities declared by the OEC.
     * Multiple activities produce multiple sections in a single document.
     */
    public byte[] generateAccreditationTechnicalFormPdf(AccreditationRequest request) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);
            PdfFont font = PdfFontFactory.createFont("Helvetica");
            PdfFont bold = PdfFontFactory.createFont("Helvetica-Bold");

            Map<String, Object> body = parseDescription(request.getDescription());
            List<String> activites = listOf(body.get("activites"));

            document.add(new Paragraph("ALGERAC — Formulaires techniques").setFont(bold).setFontSize(14).setTextAlignment(TextAlignment.CENTER));
            String refLabel = request.getReferenceNumber();
            if (refLabel == null || refLabel.isBlank()) {
                refLabel = request.getSequenceNumber() != null ? ("Séq. #" + request.getSequenceNumber()) : ("Dossier #" + request.getId());
            }
            document.add(new Paragraph("Dossier : " + refLabel).setFont(font).setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph(" "));

            if (activites.isEmpty()) {
                document.add(new Paragraph("Aucune activité déclarée.").setFont(font));
            }
            if (activites.contains("inspection")) {
                document.add(new Paragraph("FOR 04 — Inspection (ISO/IEC 17020)").setFont(bold).setFontSize(12));
                addDoc1Row(singleColumn(document, font, bold), "Type d'organisme", str(body.get("for04Type")), font, bold);
                renderTableIfAny(document, body.get("for04Domaines"), "Domaines d'inspection", font, bold);
                renderTableIfAny(document, body.get("for04Inspecteurs"), "Personnel d'inspection", font, bold);
                renderTableIfAny(document, body.get("for04Equipements"), "Équipements", font, bold);
                document.add(new Paragraph(" "));
            }
            if (activites.contains("essais")) {
                document.add(new Paragraph("FOR 05 — Essais (ISO/IEC 17025)").setFont(bold).setFontSize(12));
                renderTableIfAny(document, body.get("for05Domaines"), "Portée d'accréditation", font, bold);
                renderTableIfAny(document, body.get("for05Methodes"), "Méthodes", font, bold);
                renderTableIfAny(document, body.get("for05Equipements"), "Équipements", font, bold);
                renderTableIfAny(document, body.get("for05Personnel"), "Personnel", font, bold);
                Table et = singleColumn(document, font, bold);
                addDoc1Row(et, "Participation EIL", str(body.get("for05ParticipationEIL")), font, bold);
                addDoc1Row(et, "Procédure incertitudes", str(body.get("for05ProcedureIncertitudes")), font, bold);
                document.add(new Paragraph(" "));
            }
            if (activites.contains("etalonnage")) {
                document.add(new Paragraph("FOR 06 — Étalonnage (ISO/IEC 17025)").setFont(bold).setFontSize(12));
                renderTableIfAny(document, body.get("for06Grandeurs"), "Grandeurs et gammes", font, bold);
                renderTableIfAny(document, body.get("for06Etalons"), "Étalons de référence", font, bold);
                document.add(new Paragraph(" "));
            }
            if (activites.contains("cert_sm")) {
                document.add(new Paragraph("FOR 07 — Certification SM").setFont(bold).setFontSize(12));
                renderTableIfAny(document, body.get("for07Secteurs"), "Secteurs IAF", font, bold);
                Table referentiels = singleColumn(document, font, bold);
                addDoc1Row(referentiels, "Référentiels", joinList(body.get("for07Referentiels")), font, bold);
                document.add(new Paragraph(" "));
            }
            if (activites.contains("examens_medicaux")) {
                document.add(new Paragraph("FOR 05-1 — Biologie médicale").setFont(bold).setFontSize(12));
                renderTableIfAny(document, body.get("for051Disciplines"), "Disciplines", font, bold);
                document.add(new Paragraph(" "));
            }

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Erreur lors de la génération du PDF technique pour la demande #{}", request.getId(), e);
            throw new RuntimeException("Erreur lors de la génération du PDF technique", e);
        }
    }

    // ---- Helpers -----------------------------------------------------------

    private Table singleColumn(Document document, PdfFont font, PdfFont bold) {
        Table tbl = new Table(UnitValue.createPercentArray(new float[]{3f, 7f})).useAllAvailableWidth();
        document.add(tbl);
        return tbl;
    }

    private void addDoc1Row(Table t, String label, String value, PdfFont font, PdfFont bold) {
        t.addCell(createCell(label, bold));
        t.addCell(createCell(value == null || value.isBlank() ? "—" : value, font));
    }

    private Map<String, Object> parseDescription(String json) {
        if (json == null || json.isBlank()) return Map.of();
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return Map.of("_raw", json);
        }
    }

    private String str(Object o) {
        return o == null ? "" : o.toString();
    }

    @SuppressWarnings("unchecked")
    private List<String> listOf(Object raw) {
        if (raw instanceof List<?> l) {
            return l.stream().map(String::valueOf).toList();
        }
        return List.of();
    }

    private String joinList(Object raw) {
        List<String> l = listOf(raw);
        return l.isEmpty() ? "" : String.join(", ", l);
    }

    @SuppressWarnings("unchecked")
    private void renderTableIfAny(Document doc, Object raw, String title, PdfFont font, PdfFont bold) {
        if (!(raw instanceof List<?> rows) || rows.isEmpty()) return;
        List<Map<String, Object>> typed = new java.util.ArrayList<>();
        for (Object r : rows) {
            if (r instanceof Map<?, ?> m) typed.add((Map<String, Object>) m);
        }
        if (typed.isEmpty()) return;

        // Collect column keys preserving insertion order, ignoring internal "id"
        java.util.LinkedHashSet<String> cols = new java.util.LinkedHashSet<>();
        for (Map<String, Object> r : typed) {
            for (String k : r.keySet()) if (!"id".equals(k)) cols.add(k);
        }
        if (cols.isEmpty()) return;

        doc.add(new Paragraph(title).setFont(bold).setFontSize(11));
        float[] widths = new float[cols.size()];
        java.util.Arrays.fill(widths, 1f);
        Table table = new Table(UnitValue.createPercentArray(widths)).useAllAvailableWidth();
        for (String c : cols) table.addHeaderCell(createCell(c, bold));
        for (Map<String, Object> r : typed) {
            for (String c : cols) table.addCell(createCell(str(r.get(c)), font));
        }
        doc.add(table);
        doc.add(new Paragraph(" "));
    }
}
