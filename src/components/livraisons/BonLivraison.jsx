import React from 'react';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { exportBonLivraison } from '../../utils/exportUtils';
import PrintButton from '../ui/PrintButton';
import Button from '../ui/Button';
import { EyeIcon, PrinterIcon } from '../ui/SimpleIcons';
import Modal from '../ui/Modal';

const BonLivraison = ({ livraison, isOpen, onClose }) => {
  if (!livraison) return null;

  const handlePrint = () => {
    exportBonLivraison(livraison);
  };

  const content = (
    <div className="p-8 max-w-4xl mx-auto bg-white" id="bon-livraison">
      {/* En-tête */}
      <div className="flex justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-blue-600">ITS SÉNÉGAL</h1>
          <p className="text-sm text-gray-600">Institut de Technologie Sociale</p>
          <p className="text-sm text-gray-600">Immeuble ITS SN, Rue 19x06</p>
          <p className="text-sm text-gray-600">Point E, Dakar - Sénégal</p>
          <p className="text-sm text-gray-600">Tél: +221 33 869 45 67</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">N° BL:</span> {livraison.numero}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Date:</span> {formatDate(livraison.date)}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-semibold">N° Commande:</span> {livraison.commande?.numero || 'N/A'}
          </p>
        </div>
      </div>

      {/* Titre */}
      <h2 className="text-xl font-bold text-center mb-8 uppercase underline">
        Bon de Livraison
      </h2>

      {/* Informations client et transporteur */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="border border-gray-300 p-4 rounded">
          <h3 className="font-semibold mb-2">Livrer à:</h3>
          <p className="font-medium">{livraison.client?.nom || 'N/A'}</p>
          <p className="text-sm text-gray-600">{livraison.client?.adresse || ''}</p>
          <p className="text-sm text-gray-600">Tél: {livraison.client?.telephone || ''}</p>
          <p className="text-sm text-gray-600">Email: {livraison.client?.email || ''}</p>
        </div>
        <div className="border border-gray-300 p-4 rounded">
          <h3 className="font-semibold mb-2">Transporteur:</h3>
          <p className="font-medium">{livraison.transporteur || 'À définir'}</p>
          <p className="text-sm text-gray-600">Véhicule: {livraison.vehicule || 'N/A'}</p>
          <p className="text-sm text-gray-600">Chauffeur: {livraison.chauffeur || 'N/A'}</p>
        </div>
      </div>

      {/* Tableau des produits */}
      <table className="w-full border-collapse mb-8">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-4 py-2 text-left">Référence</th>
            <th className="border border-gray-300 px-4 py-2 text-left">Désignation</th>
            <th className="border border-gray-300 px-4 py-2 text-center">Qté Commandée</th>
            <th className="border border-gray-300 px-4 py-2 text-center">Qté Livrée</th>
            <th className="border border-gray-300 px-4 py-2 text-center">Unité</th>
          </tr>
        </thead>
        <tbody>
          {livraison.produits?.map((item, index) => (
            <tr key={index}>
              <td className="border border-gray-300 px-4 py-2">{item.produit?.reference || 'N/A'}</td>
              <td className="border border-gray-300 px-4 py-2">{item.produit?.nom || 'N/A'}</td>
              <td className="border border-gray-300 px-4 py-2 text-center">{item.quantiteCommandee}</td>
              <td className="border border-gray-300 px-4 py-2 text-center">{item.quantiteLivree}</td>
              <td className="border border-gray-300 px-4 py-2 text-center">{item.produit?.unite || 'N/A'}</td>
            </tr>
          )) || (
            <tr>
              <td colSpan="5" className="border border-gray-300 px-4 py-2 text-center text-gray-500">
                Aucun produit
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Observations */}
      {livraison.observations && (
        <div className="mb-8">
          <h3 className="font-semibold mb-2">Observations:</h3>
          <p className="text-sm text-gray-600 border border-gray-300 p-4 rounded">
            {livraison.observations}
          </p>
        </div>
      )}

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-12 mt-16">
        <div className="text-center">
          <div className="border-t-2 border-gray-400 pt-2">
            <p className="font-semibold">Signature et cachet du livreur</p>
          </div>
        </div>
        <div className="text-center">
          <div className="border-t-2 border-gray-400 pt-2">
            <p className="font-semibold">Signature et cachet du client</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (isOpen && onClose) {
    // Mode modal
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <div className="print:hidden flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Bon de Livraison - {livraison.numero}</h3>
          <PrintButton onClick={handlePrint} />
        </div>
        {content}
      </Modal>
    );
  }

  // Mode page complète
  return content;
};

export default BonLivraison;