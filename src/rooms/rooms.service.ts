import { Injectable } from '@nestjs/common';

@Injectable()
export class RoomsService {
  // Map realm -> Map room -> Set of userIds
  private realms: Map<string, Map<string, Set<string>>> = new Map();

  // Ajouter un utilisateur à une room dans un realm
  addUserToRoom(realm: string, room: string, userId: string): void {
    if (!this.realms.has(realm)) {
      this.realms.set(realm, new Map());
    }

    const rooms = this.realms.get(realm);

    if (!rooms.has(room)) {
      rooms.set(room, new Set());
    }

    rooms.get(room).add(userId);
  }

  // Retirer un utilisateur d'une room dans un realm
  removeUserFromRoom(realm: string, room: string, userId: string): void {
    if (this.realms.has(realm)) {
      const rooms = this.realms.get(realm);
      if (rooms.has(room)) {
        rooms.get(room).delete(userId);
        // Supprimer la room si elle est vide
        if (rooms.get(room).size === 0) {
          rooms.delete(room);
        }
      }

      // Supprimer le realm s'il n'y a plus de rooms
      if (rooms.size === 0) {
        this.realms.delete(realm);
      }
    }
  }

  // Récupérer les utilisateurs dans une room spécifique d'un realm
  getUsersInRoom(realm: string, room: string): string[] {
    if (this.realms.has(realm)) {
      const rooms = this.realms.get(realm);
      if (rooms.has(room)) {
        return Array.from(rooms.get(room));
      }
    }
    return [];
  }

  // Récupérer toutes les rooms d'un realm
  getRoomsInRealm(realm: string): string[] {
    if (this.realms.has(realm)) {
      return Array.from(this.realms.get(realm).keys());
    }
    return [];
  }

  // Récupérer tous les realms
  getRealms(): string[] {
    return Array.from(this.realms.keys());
  }
}
