import './BulletinVisitor.scss';
import React, { useState, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  subscribeToBulletin,
  unsubscribeToBulletin,
} from '../../../../store/actions/bulletin.actions';
import { selectBulletin, selectIsUnsubBulletin } from '../../../../store/reducers';
import { useRouteMatch } from 'react-router-dom';
import { Spinner, Alert, Button } from 'reactstrap';
import { BulletinDetails } from '../../BulletinDetails/BulletinDetails';
import { QueueVisitor } from '../QueueVisitor/QueueVisitor';
import { useSubscription } from '../../../../hooks/useSubscription';
import { MessagesVisitor } from '../MessagesVisitor/MessagesVisitor';
import { PromptModal } from '../../../ui/PromptModal/PromptModal';
import { saveOwnerToHistory } from '../../../../services/bulletin-history.service';
import { addNotification } from '../../../../store/actions/notifications.actions';

function renderAlert() {
  return (
    <Alert color="dark">
      <h3>Lost connection to the island!</h3>
      <p>
        Whoopsie! Try to refresh the page once or twice, if it persists{' '}
        <strong>it has been probably deleted</strong> by the owner.
      </p>
    </Alert>
  );
}

export const BulletinVisitor = () => {
  const match = useRouteMatch<{ bulletinId: string }>();
  const bulletinId = match.params.bulletinId;
  const isUnsubscribed = useSelector(selectIsUnsubBulletin);
  const dispatch = useDispatch();
  const subscription = useMemo(
    () => ({
      selector: selectBulletin,
      subscribe: () => {
        dispatch(subscribeToBulletin(bulletinId));
        return () => dispatch(unsubscribeToBulletin(bulletinId));
      },
    }),
    [bulletinId, dispatch],
  );
  const bulletin = useSubscription(subscription, [bulletinId]);

  const [isClaiming, setIsClaiming] = useState(false);
  const handleClaimConfirm = useCallback(
    (ownerId: string) => {
      if (ownerId === bulletin?.ownerId) {
        saveOwnerToHistory(bulletin.id, ownerId);
        /**
         * @TODO: need better solution, currently setting the ownerId on the store
         * would provoke resetting it immediately after when leaving the component
         * because of the unsubscription
         */
        window.location.reload();
      } else {
        dispatch(addNotification({ message: 'Invalid token', type: 'danger' }));
      }

      setIsClaiming(false);
    },
    [bulletin, dispatch],
  );

  if (!bulletin) {
    return (
      <div className="row justify-content-center">
        <div className="col-md-10 col-lg-8 col-xl-6">
          {isUnsubscribed ? renderAlert() : <Spinner type="grow" />}
        </div>
      </div>
    );
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-10 col-lg-8 col-xl-6">
        <div className="bulletin-visitor">
          {isUnsubscribed ? renderAlert() : null}
          <BulletinDetails bulletin={bulletin} />
          <QueueVisitor bulletin={bulletin} />
          <MessagesVisitor bulletin={bulletin} />
          <div className="f6 text-right">
            Image credits:{' '}
            <a
              href="https://dribbble.com/shots/11137115-Turnip"
              target="_blank"
              rel="noopener noreferrer"
            >
              Cherryink
            </a>
          </div>
          <div className="text-right">
            <Button color="link" className="f6 p-0 text-muted" onClick={() => setIsClaiming(true)}>
              Claim island ownership
            </Button>
          </div>
        </div>

        {isClaiming ? (
          <PromptModal
            isOpen={isClaiming}
            onCancel={() => setIsClaiming(false)}
            onConfirm={handleClaimConfirm}
            inputProps={{ placeholder: 'Token' }}
          >
            <p>
              You can claim the ownership of the island if you know the secret token. This feature
              is useful if you created the post on the computer then you move to the phone.
            </p>
          </PromptModal>
        ) : null}
      </div>
    </div>
  );
};