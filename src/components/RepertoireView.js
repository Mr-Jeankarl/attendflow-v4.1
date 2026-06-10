// src/components/RepertoireView.js
import React, { useState, useEffect } from 'react';
import { uploadSongFile } from '../firebase/database';



function RepertoireView({
  organization,
  isOnline,
  isAdmin,
  isOwner,
  onAddSong,
  onUpdateSong,
  onDeleteSong
}) {
  const [songs, setSongs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSongForEdit, setSelectedSongForEdit] = useState(null);
  const [expandedSongId, setExpandedSongId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [voiceParts, setVoiceParts] = useState(['Soprano', 'Alto', 'Ténor', 'Basse']);

  // Formulaire pour ajouter/éditer
  const [songForm, setSongForm] = useState({
    title: '',
    pdfFile: null,
    audioFile: null,
    pupitresFiles: {} // { Soprano: File, Alto: File, ... }
  });

  // Charger les chants depuis l'organisation
  useEffect(() => {
    if (organization?.repertoire) {
      setSongs(Object.values(organization.repertoire));
    } else {
      setSongs([]);
    }
  }, [organization]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const toggleExpandSong = (songId) => {
    setExpandedSongId(expandedSongId === songId ? null : songId);
  };

  const handleFileChange = (e, type, pupitreName = null) => {
    const file = e.target.files[0];
    if (!file) return;

    // Limiter la taille des fichiers à 15 Mo pour les audios
    const maxSize = type === 'pdf' ? 5 * 1024 * 1024 : 15 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`Le fichier est trop lourd (max ${maxSize / (1024 * 1024)} Mo).`);
      e.target.value = '';
      return;
    }

    if (type === 'pdf') {
      setSongForm(prev => ({ ...prev, pdfFile: file }));
    } else if (type === 'audio') {
      setSongForm(prev => ({ ...prev, audioFile: file }));
    } else if (type === 'pupitre' && pupitreName) {
      setSongForm(prev => ({
        ...prev,
        pupitresFiles: { ...prev.pupitresFiles, [pupitreName]: file }
      }));
    }
  };

  const openAddModal = () => {
    setSongForm({
      title: '',
      pdfFile: null,
      audioFile: null,
      pupitresFiles: {}
    });
    setVoiceParts(['Soprano', 'Alto', 'Ténor', 'Basse']);
    setSelectedSongForEdit(null);
    setShowAddModal(true);
  };

  const openEditModal = (song, e) => {
    e.stopPropagation();
    setSongForm({
      title: song.title,
      pdfFile: null,
      audioFile: null,
      pupitresFiles: {}
    });
    const existingParts = Object.keys(song.pupitresAudio || {});
    const defaultParts = ['Soprano', 'Alto', 'Ténor', 'Basse'];
    const combined = Array.from(new Set([...defaultParts, ...existingParts]));
    setVoiceParts(combined);
    setSelectedSongForEdit(song);
    setShowAddModal(true);
  };

  const addCustomVoicePart = () => {
    const name = window.prompt("Entrez le nom du pupitre ou de la partition (ex: Soprano 2, Basse Solo) :");
    if (name && name.trim()) {
      const trimmedName = name.trim();
      if (!voiceParts.includes(trimmedName)) {
        setVoiceParts(prev => [...prev, trimmedName]);
      } else {
        alert("Ce pupitre existe déjà.");
      }
    }
  };

  const handleSaveSong = async (e) => {
    e.preventDefault();
    if (!songForm.title.trim()) {
      alert('Le titre est obligatoire.');
      return;
    }

    // Si on a des fichiers et qu'on est offline, bloquer
    const hasFilesToUpload = songForm.pdfFile || songForm.audioFile || Object.keys(songForm.pupitresFiles).length > 0;
    if (hasFilesToUpload && !isOnline) {
      alert('Vous devez être connecté à Internet pour téléverser des fichiers.');
      return;
    }

    setUploading(true);
    setUploadProgress('Préparation du téléversement...');

    try {
      // 1. Créer ou récupérer l'ID du chant
      let songId = selectedSongForEdit ? selectedSongForEdit.id : 'song_' + Date.now();
      let pdfUrl = selectedSongForEdit ? selectedSongForEdit.pdfUrl : '';
      let audioUrl = selectedSongForEdit ? selectedSongForEdit.audioUrl : '';
      let pupitresAudio = selectedSongForEdit ? { ...selectedSongForEdit.pupitresAudio } : {};

      // 2. Téléverser les fichiers sur Firebase Storage
      if (songForm.pdfFile) {
        setUploadProgress('Téléversement de la partition PDF...');
        pdfUrl = await uploadSongFile(songId, 'pdf', songForm.pdfFile);
      }

      if (songForm.audioFile) {
        setUploadProgress('Téléversement de l\'audio complet...');
        audioUrl = await uploadSongFile(songId, 'audio_complet', songForm.audioFile);
      }

      for (const pupitre of voiceParts) {
        const file = songForm.pupitresFiles[pupitre];
        if (file) {
          setUploadProgress(`Téléversement de l'audio pour ${pupitre}...`);
          const safePrefix = pupitre.replace(/\s+/g, '_');
          const url = await uploadSongFile(songId, `audio_${safePrefix}`, file);
          pupitresAudio[pupitre] = url;
        }
      }

      // Keep only voice parts that are in the active voiceParts list
      const updatedPupitresAudio = {};
      voiceParts.forEach(pupitre => {
        if (pupitresAudio[pupitre]) {
          updatedPupitresAudio[pupitre] = pupitresAudio[pupitre];
        }
      });
      pupitresAudio = updatedPupitresAudio;

      // 3. Enregistrer les métadonnées dans la base de données
      const songData = {
        id: songId,
        title: songForm.title,
        pdfUrl,
        audioUrl,
        pupitresAudio
      };

      if (selectedSongForEdit) {
        await onUpdateSong(songId, songData);
        alert('Chant mis à jour avec succès !');
      } else {
        await onAddSong(songData);
        alert('Chant ajouté au répertoire avec succès !');
      }

      setShowAddModal(false);
    } catch (error) {
      console.error(error);
      alert('Une erreur est survenue lors de l\'enregistrement : ' + error.message);
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  const handleDeleteClick = async (song, e) => {
    e.stopPropagation();
    const confirmDelete = window.confirm(`Voulez-vous vraiment supprimer "${song.title}" du répertoire ?`);
    if (confirmDelete) {
      try {
        await onDeleteSong(song.id, song);
        alert('Chant supprimé avec succès.');
      } catch (error) {
        alert('Erreur lors de la suppression : ' + error.message);
      }
    }
  };

  // Filtrer les chants par recherche
  const filteredSongs = songs.filter(song =>
    song.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="repertoire-view">
      <div className="repertoire-header-bar">
        <h2>Répertoire Musical</h2>
        {isAdmin && (
          <button onClick={openAddModal} className="btn-primary">
            ➕ Ajouter un chant
          </button>
        )}
      </div>

      <div className="search-container-repertoire">
        <input
          type="text"
          placeholder="Rechercher un chant par titre..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="repertoire-search-input"
        />
      </div>

      {filteredSongs.length === 0 ? (
        <p className="empty-state">Aucun chant trouvé dans le répertoire.</p>
      ) : (
        <div className="songs-grid">
          {filteredSongs.map(song => {
            const isExpanded = expandedSongId === song.id;

            return (
              <div
                key={song.id}
                className={`song-card ${isExpanded ? 'expanded' : ''}`}
                onClick={() => toggleExpandSong(song.id)}
              >
                <div className="song-card-header">
                  <div className="song-info-main">
                    <span className="song-icon">🎵</span>
                    <h3 className="song-title-text">{song.title}</h3>
                  </div>
                  <div className="song-actions-top">
                    {song.pdfUrl && (
                      <a
                        href={song.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-song-action pdf-btn"
                        onClick={(e) => e.stopPropagation()}
                        title="Télécharger la partition"
                      >
                        📄 Partition
                      </a>
                    )}
                    {isAdmin && (
                      <div className="admin-song-buttons">
                        <button
                          onClick={(e) => openEditModal(song, e)}
                          className="btn-song-action edit-btn"
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => handleDeleteClick(song, e)}
                          className="btn-song-action delete-btn"
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {song.audioUrl && (
                  <div className="song-audio-complet" onClick={(e) => e.stopPropagation()}>
                    <span className="audio-label">Chant Complet :</span>
                    <audio controls src={song.audioUrl} className="custom-audio-player" />
                  </div>
                )}

                {isExpanded && (
                  <div className="song-pupitres-section" onClick={(e) => e.stopPropagation()}>
                    <h4>Pistes d'entraînement par pupitre</h4>
                    {Object.keys(song.pupitresAudio || {}).length === 0 ? (
                      <p className="no-pupitre-audio-text">Aucune piste spécifique enregistrée.</p>
                    ) : (
                      <div className="pupitres-audio-list">
                        {Object.entries(song.pupitresAudio).map(([pupitre, url]) => {
                          if (!url) return null;
                          return (
                            <div key={pupitre} className="pupitre-audio-row">
                              <span className="pupitre-badge-repertoire">{pupitre}</span>
                              <audio controls src={url} className="custom-audio-player-small" />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                
                <p className="click-hint-song">
                  {isExpanded ? "👆 Cliquez pour replier" : "👆 Cliquez pour afficher les pistes par pupitre"}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL AJOUT/EDITION */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => !uploading && setShowAddModal(false)}>
          <div className="modal-content modal-repertoire" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedSongForEdit ? '✏️ Modifier le chant' : '➕ Ajouter un chant'}</h2>
              <button className="modal-close" onClick={() => !uploading && setShowAddModal(false)} disabled={uploading}>✕</button>
            </div>
            <div className="modal-body">
              {uploading ? (
                <div className="upload-loader-container">
                  <div className="spinner"></div>
                  <p className="upload-progress-text">{uploadProgress}</p>
                </div>
              ) : (
                <form onSubmit={handleSaveSong} className="song-form-modal">
                  <div className="form-group">
                    <label>Titre du chant <span className="required">*</span> :</label>
                    <input
                      type="text"
                      value={songForm.title}
                      onChange={(e) => setSongForm({ ...songForm, title: e.target.value })}
                      placeholder="Nom du chant"
                      required
                    />
                  </div>

                  {!isOnline && (
                    <div className="offline-warning-repertoire-form">
                      ⚠️ L'ajout ou la modification de fichiers (partition/audio) est désactivé hors-ligne.
                    </div>
                  )}

                  <div className="form-group">
                    <label>Partition (PDF) :</label>
                    {selectedSongForEdit?.pdfUrl && (
                      <p className="current-file-info">✓ Une partition existe déjà</p>
                    )}
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => handleFileChange(e, 'pdf')}
                      disabled={!isOnline}
                    />
                  </div>

                  <div className="form-group">
                    <label>Audio Chant Complet :</label>
                    {selectedSongForEdit?.audioUrl && (
                      <p className="current-file-info">✓ Un audio complet existe déjà</p>
                    )}
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => handleFileChange(e, 'audio')}
                      disabled={!isOnline}
                    />
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <label style={{ margin: 0 }}>Audios d'apprentissage par pupitre :</label>
                      <button
                        type="button"
                        onClick={addCustomVoicePart}
                        className="btn-upload-bg"
                        style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                      >
                        ➕ Ajouter un pupitre/voix
                      </button>
                    </div>
                    <div className="pupitres-files-grid">
                      {voiceParts.map(pupitre => (
                        <div key={pupitre} className="pupitre-file-field" style={{ position: 'relative' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="pupitre-field-label">{pupitre} :</span>
                            <button
                              type="button"
                              onClick={() => setVoiceParts(prev => prev.filter(v => v !== pupitre))}
                              style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '0.9rem', padding: '2px' }}
                              title="Supprimer ce pupitre"
                            >
                              🗑️
                            </button>
                          </div>
                          {selectedSongForEdit?.pupitresAudio?.[pupitre] && (
                            <span className="current-file-info-small">✓ Existant</span>
                          )}
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={(e) => handleFileChange(e, 'pupitre', pupitre)}
                            disabled={!isOnline}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="btn-secondary"
                      disabled={uploading}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={uploading}
                    >
                      Enregistrer
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RepertoireView;
